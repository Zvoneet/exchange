import { IntentFilters } from "@exchange/shared";

export type RequesterContext = {
  geo?: { lat: number; lng: number };
  locale?: string;
  timezone?: string;
};

export interface AiQueryMapper {
  mapIntentToFilters(query: string, requesterContext?: RequesterContext): Promise<IntentFilters>;
}
