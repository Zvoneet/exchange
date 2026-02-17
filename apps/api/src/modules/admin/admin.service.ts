import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { compare, hashSync } from "bcryptjs";

import { PrismaService } from "../../prisma/prisma.service";
import { AuthService } from "../auth/auth.service";
import { AgentsService } from "../agents/agents.service";

@Injectable()
export class AdminService {
  private readonly adminPasswordHash: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly agentsService: AgentsService
  ) {
    const configuredHash = process.env.ADMIN_PASSWORD_HASH;
    if (configuredHash) {
      this.adminPasswordHash = configuredHash;
    } else {
      const plain = process.env.ADMIN_PASSWORD ?? "admin123";
      this.adminPasswordHash = hashSync(plain, 10);
    }
  }

  async login(password: string) {
    const ok = await compare(password, this.adminPasswordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");
    return { accessToken: this.authService.signAdminToken() };
  }

  async listAgents() {
    const agents = await this.prisma.agent.findMany({
      include: { capabilities: true, metadata: true },
      orderBy: { createdAt: "desc" }
    });

    return agents.map((agent) => ({
      id: agent.id,
      displayName: agent.displayName,
      handle: agent.handle ? `@${agent.handle}` : null,
      agentType: agent.agentType,
      capabilitiesCount: agent.capabilities.length,
      tags: (agent.metadata?.tags as string[] | null) ?? [],
      createdAt: agent.createdAt.toISOString(),
      lastSeenAt: agent.lastSeenAt?.toISOString() ?? null,
      status: agent.status
    }));
  }

  async getAgent(id: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      include: { capabilities: true, metadata: true }
    });
    if (!agent) {
      throw new NotFoundException("Agent not found");
    }
    return {
      ...agent,
      handle: agent.handle ? `@${agent.handle}` : null
    };
  }

  async deleteAgent(id: string) {
    const existing = await this.prisma.agent.findUnique({
      where: { id },
      select: { id: true }
    });
    if (!existing) {
      throw new NotFoundException("Agent not found");
    }

    await this.prisma.agent.delete({
      where: { id }
    });

    return { ok: true };
  }

  getConfig() {
    return this.agentsService.getRegistrationConfig();
  }

  updateConfig(mode: "open" | "code_required", code?: string) {
    return this.agentsService.setRegistrationConfig(mode, code);
  }
}
