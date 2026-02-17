import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service";
import { randomBytes, createHash } from "crypto";

@Injectable()
export class AuthService {
  private readonly accessTokenExpiresIn = process.env.JWT_EXPIRES_IN ?? "15m";
  private readonly refreshDays = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS ?? 30);

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService
  ) {}

  signAgentAccessToken(agentId: string) {
    return this.jwt.sign(
      {
        sub: agentId,
        role: "agent"
      },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: this.accessTokenExpiresIn
      }
    );
  }

  signAdminToken() {
    return this.jwt.sign(
      {
        role: "admin"
      },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: "8h"
      }
    );
  }

  async issueRefreshToken(agentId: string) {
    const token = randomBytes(48).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");

    await this.prisma.refreshToken.create({
      data: {
        agentId,
        tokenHash
      }
    });

    return token;
  }

  async refreshAccessToken(agentId: string, refreshToken: string) {
    const tokenHash = createHash("sha256").update(refreshToken).digest("hex");
    const existing = await this.prisma.refreshToken.findFirst({
      where: {
        agentId,
        tokenHash,
        revokedAt: null
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    if (!existing) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const expiryDate = new Date(existing.createdAt.getTime() + this.refreshDays * 24 * 60 * 60 * 1000);
    if (Date.now() > expiryDate.getTime()) {
      await this.prisma.refreshToken.update({
        where: { id: existing.id },
        data: { revokedAt: new Date() }
      });
      throw new UnauthorizedException("Refresh token expired");
    }

    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() }
    });

    const nextRefreshToken = await this.issueRefreshToken(agentId);
    const accessToken = this.signAgentAccessToken(agentId);
    return { accessToken, refreshToken: nextRefreshToken };
  }

  async revokeAgentTokens(agentId: string) {
    await this.prisma.refreshToken.updateMany({
      where: {
        agentId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });
  }

  verifyToken(token: string): { sub?: string; role?: string } {
    return this.jwt.verify(token, { secret: process.env.JWT_SECRET });
  }
}
