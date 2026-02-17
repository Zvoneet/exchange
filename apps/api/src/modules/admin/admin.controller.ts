import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import { AdminAuthGuard } from "../auth/guards/admin-auth.guard";
import { AdminService } from "./admin.service";
import { AdminLoginDto, UpdateConfigDto } from "./dto/admin.dto";

@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post("login")
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async login(@Body() body: AdminLoginDto) {
    return this.adminService.login(body.password);
  }

  @Get("agents")
  @UseGuards(AdminAuthGuard)
  async listAgents() {
    return this.adminService.listAgents();
  }

  @Get("agents/:id")
  @UseGuards(AdminAuthGuard)
  async getAgent(@Param("id") id: string) {
    return this.adminService.getAgent(id);
  }

  @Delete("agents/:id")
  @UseGuards(AdminAuthGuard)
  async deleteAgent(@Param("id") id: string) {
    return this.adminService.deleteAgent(id);
  }

  @Get("config")
  @UseGuards(AdminAuthGuard)
  async getConfig() {
    return this.adminService.getConfig();
  }

  @Patch("config")
  @UseGuards(AdminAuthGuard)
  async patchConfig(@Body() body: UpdateConfigDto) {
    return this.adminService.updateConfig(body.registrationMode, body.registrationCode);
  }
}
