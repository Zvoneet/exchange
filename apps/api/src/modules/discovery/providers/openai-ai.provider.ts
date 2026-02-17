import { Injectable, NotImplementedException } from "@nestjs/common";
import { IntentFilters } from "@exchange/shared";
import { AiQueryMapper, RequesterContext } from "./ai-query-mapper.interface";

@Injectable()
export class OpenAiStubProvider implements AiQueryMapper {
  async mapIntentToFilters(_query: string, _requesterContext?: RequesterContext): Promise<IntentFilters> {
    throw new NotImplementedException("AI_PROVIDER=openai is a stub in this MVP. Use AI_PROVIDER=mock.");
  }
}
