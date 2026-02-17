import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from "@nestjs/common";
import { Agent, AgentMetadata, Capability, Prisma } from "@prisma/client";
import { hash, compare } from "bcryptjs";

import { AuthService } from "../auth/auth.service";
import { PrismaService } from "../../prisma/prisma.service";
import { ClaimHandleDto, HeartbeatDto, RegisterAgentDto } from "./dto/register-agent.dto";

@Injectable()
export class AgentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService
  ) {}

  private ensureJsonObject(value: unknown): Prisma.InputJsonObject {
    if (value == null) {
      return {};
    }
    if (typeof value !== "object" || Array.isArray(value)) {
      throw new BadRequestException("metadata.extra must be a JSON object");
    }
    return value as Prisma.InputJsonObject;
  }

  async registerAgent(body: RegisterAgentDto) {
    const config = await this.prisma.exchangeConfig.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, registrationMode: "open" }
    });

    if (config.registrationMode === "code_required") {
      if (!body.registrationCode || !config.registrationCodeHash) {
        throw new UnauthorizedException("Registration code required");
      }
      const ok = await compare(body.registrationCode, config.registrationCodeHash);
      if (!ok) {
        throw new UnauthorizedException("Invalid registration code");
      }
    }

    if (body.publicUrl) {
      const existing = await this.prisma.agent.findFirst({
        where: {
          publicUrl: body.publicUrl,
          status: {
            not: "revoked"
          }
        }
      });

      if (existing) {
        const now = new Date();
        await this.prisma.agent.update({
          where: { id: existing.id },
          data: {
            lastSeenAt: now,
            displayName: body.displayName,
            agentType: body.agentType
          }
        });

        return {
          alreadyRegistered: true,
          exchangeAgentId: existing.id,
          acknowledgedAt: now.toISOString()
        };
      }
    }

    const now = new Date();
    const created = await this.prisma.agent.create({
      data: {
        displayName: body.displayName,
        agentType: body.agentType,
        publicUrl: body.publicUrl,
        status: "active",
        createdAt: now,
        lastSeenAt: now,
        capabilities: {
          create: body.capabilities.map((cap) => ({
            name: cap.name,
            version: cap.version,
            actions: cap.actions ?? []
          }))
        },
        metadata: {
          create: {
            tags: body.metadata.tags ?? [],
            categories: body.metadata.categories ?? [],
            locales: body.metadata.locales ?? [],
            geoLat: body.metadata.geo?.lat,
            geoLng: body.metadata.geo?.lng,
            geoRadiusKm: body.metadata.geo?.radiusKm,
            cuisines: body.metadata.business?.cuisines ?? [],
            serviceArea: body.metadata.business?.serviceArea,
            extra: this.ensureJsonObject(body.metadata.extra)
          }
        }
      }
    });

    const accessToken = this.authService.signAgentAccessToken(created.id);
    const refreshToken = await this.authService.issueRefreshToken(created.id);

    return {
      exchangeAgentId: created.id,
      issuedAt: now.toISOString(),
      accessToken,
      refreshToken
    };
  }

  async claimHandle(agentId: string, body: ClaimHandleDto) {
    const handle = body.handle.toLowerCase();
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      select: { id: true }
    });
    if (!agent) {
      throw new NotFoundException("Agent not found");
    }

    const existingOwner = await this.prisma.agent.findUnique({
      where: { handle },
      select: { id: true }
    });
    if (existingOwner && existingOwner.id !== agentId) {
      throw new ConflictException("Handle already taken");
    }

    try {
      const updated = await this.prisma.agent.update({
        where: { id: agentId },
        data: { handle }
      });
      return {
        exchangeAgentId: updated.id,
        handle: updated.handle
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Handle already taken");
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException("Agent not found");
      }
      throw error;
    }
  }

  async getByHandle(handle: string) {
    const cleaned = handle.toLowerCase().replace(/^@/, "");
    const agent = await this.prisma.agent.findUnique({
      where: { handle: cleaned },
      include: {
        capabilities: true,
        metadata: true
      }
    });

    if (!agent) {
      throw new BadRequestException("Unknown handle");
    }

    return this.toPublicAgent(agent);
  }

  async heartbeat(agentId: string, body: HeartbeatDto) {
    await this.prisma.agent.update({
      where: { id: agentId },
      data: {
        lastSeenAt: new Date(),
        publicUrl: body.publicUrl
      }
    });
    return { ok: true };
  }

  private toPublicAgent(agent: Agent & { capabilities: Capability[]; metadata: AgentMetadata | null }) {
    return {
      exchangeAgentId: agent.id,
      handle: agent.handle ? `@${agent.handle}` : null,
      displayName: agent.displayName,
      agentType: agent.agentType,
      publicUrl: agent.publicUrl,
      capabilities: agent.capabilities.map((c) => ({
        name: c.name,
        version: c.version,
        actions: c.actions
      })),
      metadata: {
        tags: (agent.metadata?.tags as string[] | null) ?? [],
        categories: (agent.metadata?.categories as string[] | null) ?? [],
        locales: (agent.metadata?.locales as string[] | null) ?? [],
        geo:
          agent.metadata?.geoLat != null && agent.metadata?.geoLng != null
            ? {
                lat: agent.metadata.geoLat,
                lng: agent.metadata.geoLng,
                radiusKm: agent.metadata.geoRadiusKm ?? undefined
              }
            : null,
        business: {
          cuisines: (agent.metadata?.cuisines as string[] | null) ?? [],
          serviceArea: agent.metadata?.serviceArea ?? null
        },
        extra: (agent.metadata?.extra as Record<string, unknown> | null) ?? {}
      }
    };
  }

  async setRegistrationConfig(mode: "open" | "code_required", code?: string) {
    let registrationCodeHash: string | null | undefined = undefined;
    if (mode === "code_required") {
      if (!code || code.length < 3) {
        throw new BadRequestException("registration code must be at least 3 chars");
      }
      registrationCodeHash = await hash(code, 10);
    }
    const config = await this.prisma.exchangeConfig.upsert({
      where: { id: 1 },
      update: {
        registrationMode: mode,
        ...(registrationCodeHash === undefined ? {} : { registrationCodeHash })
      },
      create: {
        id: 1,
        registrationMode: mode,
        registrationCodeHash: registrationCodeHash ?? null
      }
    });
    return {
      registrationMode: config.registrationMode,
      updatedAt: config.updatedAt.toISOString()
    };
  }

  async getRegistrationConfig() {
    const config = await this.prisma.exchangeConfig.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, registrationMode: "open" }
    });
    return {
      registrationMode: config.registrationMode,
      codeConfigured: Boolean(config.registrationCodeHash),
      updatedAt: config.updatedAt.toISOString()
    };
  }
}
