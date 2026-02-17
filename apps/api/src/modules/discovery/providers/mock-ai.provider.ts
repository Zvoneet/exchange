import { Injectable } from "@nestjs/common";
import { IntentFilters } from "@exchange/shared";
import { AiQueryMapper, RequesterContext } from "./ai-query-mapper.interface";

const CUISINES = ["italian", "mexican", "chinese", "japanese", "thai", "indian", "french", "greek", "american"];

@Injectable()
export class MockAiProvider implements AiQueryMapper {
  async mapIntentToFilters(query: string, requesterContext?: RequesterContext): Promise<IntentFilters> {
    const normalized = query.toLowerCase();
    const filters: IntentFilters = {
      limit: 20
    };

    if (normalized.includes("book") || normalized.includes("reservation")) {
      filters.capability = "reservation.make";
    }

    const cuisine = CUISINES.find((c) => normalized.includes(c));
    if (cuisine) {
      filters.cuisine = cuisine;
    }

    if ((normalized.includes("near me") || normalized.includes("local")) && requesterContext?.geo) {
      filters.geo = {
        lat: requesterContext.geo.lat,
        lng: requesterContext.geo.lng,
        radiusKm: 10
      };
    }

    const dayMatch = normalized.match(
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/
    );
    if (dayMatch) {
      filters.desiredDayOfWeek = dayMatch[1];
    }

    const timeMatch = normalized.match(/\b(\d{1,2}(?::\d{2})?\s?(am|pm)?)\b/);
    if (timeMatch) {
      filters.desiredTimeLocal = timeMatch[1];
    }

    return filters;
  }
}
