import { Body, Controller, Post } from "@nestjs/common";
import { DiscoveryService } from "./discovery.service";
import { IntentSearchDto, StructuredSearchDto } from "./dto/discovery.dto";

@Controller("discovery")
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Post("search")
  async search(@Body() body: StructuredSearchDto) {
    return this.discoveryService.searchStructured(body);
  }

  @Post("intent")
  async intent(@Body() body: IntentSearchDto) {
    return this.discoveryService.searchIntent(body);
  }
}
