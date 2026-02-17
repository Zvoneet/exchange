import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import { AgentAuthGuard } from "../auth/guards/agent-auth.guard";
import { AgentsService } from "./agents.service";
import {
  ClaimHandleDto,
  HeartbeatDto,
  RegisterAgentDto,
} from "./dto/register-agent.dto";

@Controller("agents")
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post("register")
  @Throttle({ default: { limit: 25, ttl: 60_000 } })
  async register(@Body() body: RegisterAgentDto) {
    return this.agentsService.registerAgent(body);
  }

  @Post("handle")
  @UseGuards(AgentAuthGuard)
  async claimHandle(
    @Req() req: { agentId: string },
    @Body() body: ClaimHandleDto,
  ) {
    return this.agentsService.claimHandle(req.agentId, body);
  }

  @Get("@:handle")
  async byHandle(@Param("handle") handle: string) {
    return this.agentsService.getByHandle(handle);
  }

  @Post("heartbeat")
  @UseGuards(AgentAuthGuard)
  async heartbeat(@Req() req: { agentId: string }, @Body() body: HeartbeatDto) {
    return this.agentsService.heartbeat(req.agentId, body);
  }
}
