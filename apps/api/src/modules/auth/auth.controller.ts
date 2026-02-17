import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import { RefreshDto } from "./dto/refresh.dto";
import { AuthService } from "./auth.service";
import { AgentAuthGuard } from "./guards/agent-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("refresh")
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async refresh(@Body() body: RefreshDto) {
    return this.authService.refreshAccessToken(body.exchangeAgentId, body.refreshToken);
  }

  @Post("revoke")
  @UseGuards(AgentAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async revoke(@Req() req: { agentId: string }) {
    await this.authService.revokeAgentTokens(req.agentId);
    return { ok: true };
  }
}
