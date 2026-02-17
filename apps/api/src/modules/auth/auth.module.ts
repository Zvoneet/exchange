import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AgentAuthGuard } from "./guards/agent-auth.guard";
import { AdminAuthGuard } from "./guards/admin-auth.guard";

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, AgentAuthGuard, AdminAuthGuard],
  exports: [AuthService, AgentAuthGuard, AdminAuthGuard]
})
export class AuthModule {}
