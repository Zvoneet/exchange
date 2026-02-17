import { Module } from "@nestjs/common";

import { DiscoveryController } from "./discovery.controller";
import { DiscoveryService } from "./discovery.service";
import { MockAiProvider } from "./providers/mock-ai.provider";
import { OpenAiStubProvider } from "./providers/openai-ai.provider";

const aiProviderFactory = {
  provide: "AI_QUERY_MAPPER",
  useFactory: (mockProvider: MockAiProvider, openAiProvider: OpenAiStubProvider) => {
    const provider = process.env.AI_PROVIDER ?? "mock";
    if (provider === "openai") return openAiProvider;
    return mockProvider;
  },
  inject: [MockAiProvider, OpenAiStubProvider]
};

@Module({
  controllers: [DiscoveryController],
  providers: [MockAiProvider, OpenAiStubProvider, aiProviderFactory, DiscoveryService]
})
export class DiscoveryModule {}
