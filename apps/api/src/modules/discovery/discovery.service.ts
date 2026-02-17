import { Inject, Injectable } from "@nestjs/common";
import { Agent, AgentMetadata, Capability } from "@prisma/client";
import { IntentFilters, IntentFiltersSchema, StructuredDiscoveryFiltersSchema } from "@exchange/shared";

import { PrismaService } from "../../prisma/prisma.service";
import { AiQueryMapper } from "./providers/ai-query-mapper.interface";
import { IntentSearchDto, StructuredSearchDto } from "./dto/discovery.dto";

type AgentWithRelations = Agent & {
  capabilities: Capability[];
  metadata: AgentMetadata | null;
};

@Injectable()
export class DiscoveryService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject("AI_QUERY_MAPPER")
    private readonly aiMapper: AiQueryMapper
  ) {}

  async searchStructured(rawFilters: StructuredSearchDto) {
    const filters = StructuredDiscoveryFiltersSchema.parse(rawFilters);
    const initial = await this.prisma.agent.findMany({
      where: {
        status: "active",
        ...(filters.capability
          ? {
              capabilities: {
                some: {
                  name: filters.capability
                }
              }
            }
          : {})
      },
      include: {
        capabilities: true,
        metadata: true
      },
      take: Math.min(Math.max(filters.limit ?? 20, 1), 100)
    });

    const scored = this.applyInMemoryFilters(initial, filters);
    return {
      filters,
      count: scored.length,
      items: scored.map((row) => row.item)
    };
  }

  async searchIntent(body: IntentSearchDto) {
    const mapped = await this.aiMapper.mapIntentToFilters(body.query, body.requesterContext);
    const filters = IntentFiltersSchema.parse(mapped);

    const structuredResults = await this.searchStructured({
      capability: filters.capability,
      cuisine: filters.cuisine,
      tags: filters.tags,
      categories: filters.categories,
      geo: filters.geo,
      limit: filters.limit
    });

    const withExplanation = structuredResults.items.map((item) => ({
      ...item,
      explanation: this.explainIntentMatch(filters, item)
    }));

    return {
      originalQuery: body.query,
      interpretedFilters: filters,
      count: withExplanation.length,
      items: withExplanation
    };
  }

  private applyInMemoryFilters(rows: AgentWithRelations[], filters: Partial<IntentFilters>) {
    const filtered = rows
      .map((agent) => ({ item: this.serializeAgent(agent), score: this.computeScore(agent, filters) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .filter((entry) => {
        const metadata = entry.item.metadata;
        if (!metadata) return true;

        if (filters.tags?.length) {
          const tags = new Set((metadata.tags ?? []).map((v) => v.toLowerCase()));
          const allPresent = filters.tags.every((v) => tags.has(v.toLowerCase()));
          if (!allPresent) return false;
        }

        if (filters.categories?.length) {
          const categories = new Set((metadata.categories ?? []).map((v) => v.toLowerCase()));
          const hasAny = filters.categories.some((v) => categories.has(v.toLowerCase()));
          if (!hasAny) return false;
        }

        if (filters.cuisine) {
          const cuisines = new Set((metadata.business?.cuisines ?? []).map((v) => v.toLowerCase()));
          if (!cuisines.has(filters.cuisine.toLowerCase())) return false;
        }

        if (filters.geo && metadata.geo) {
          const distance = this.haversineKm(
            filters.geo.lat,
            filters.geo.lng,
            metadata.geo.lat,
            metadata.geo.lng
          );
          if (distance > filters.geo.radiusKm) return false;
        }
        return true;
      });

    return filtered;
  }

  private computeScore(agent: AgentWithRelations, filters: Partial<IntentFilters>) {
    let score = 1;
    if (filters.capability && agent.capabilities.some((cap) => cap.name === filters.capability)) score += 10;
    const cuisines = ((agent.metadata?.cuisines as string[] | null) ?? []).map((x) => x.toLowerCase());
    if (filters.cuisine && cuisines.includes(filters.cuisine.toLowerCase())) score += 5;
    if (filters.tags?.length) {
      const tags = new Set((((agent.metadata?.tags as string[] | null) ?? []).map((x) => x.toLowerCase())));
      score += filters.tags.filter((tag) => tags.has(tag.toLowerCase())).length;
    }
    if (filters.categories?.length) {
      const categories = new Set((((agent.metadata?.categories as string[] | null) ?? []).map((x) => x.toLowerCase())));
      score += filters.categories.filter((cat) => categories.has(cat.toLowerCase())).length;
    }
    return score;
  }

  private explainIntentMatch(filters: IntentFilters, item: ReturnType<DiscoveryService["serializeAgent"]>) {
    const parts = ["Matched active assistant profile"];
    if (filters.capability) parts.push(`capability=${filters.capability}`);
    if (filters.cuisine) parts.push(`cuisine=${filters.cuisine}`);
    if (filters.geo) parts.push(`geo within ${filters.geo.radiusKm}km`);
    if (filters.desiredDayOfWeek) parts.push(`day=${filters.desiredDayOfWeek}`);
    if (filters.desiredTimeLocal) parts.push(`time=${filters.desiredTimeLocal}`);
    return parts.join("; ");
  }

  private serializeAgent(agent: AgentWithRelations) {
    return {
      exchangeAgentId: agent.id,
      displayName: agent.displayName,
      handle: agent.handle ? `@${agent.handle}` : null,
      agentType: agent.agentType,
      publicUrl: agent.publicUrl,
      status: agent.status,
      createdAt: agent.createdAt.toISOString(),
      lastSeenAt: agent.lastSeenAt?.toISOString() ?? null,
      capabilities: agent.capabilities.map((cap) => ({
        name: cap.name,
        version: cap.version,
        actions: cap.actions ?? []
      })),
      metadata: agent.metadata
        ? {
            tags: (agent.metadata.tags as string[] | null) ?? [],
            categories: (agent.metadata.categories as string[] | null) ?? [],
            locales: (agent.metadata.locales as string[] | null) ?? [],
            geo:
              agent.metadata.geoLat != null && agent.metadata.geoLng != null
                ? {
                    lat: agent.metadata.geoLat,
                    lng: agent.metadata.geoLng,
                    radiusKm: agent.metadata.geoRadiusKm ?? undefined
                  }
                : null,
            business: {
              cuisines: (agent.metadata.cuisines as string[] | null) ?? [],
              serviceArea: agent.metadata.serviceArea ?? null
            },
            extra: (agent.metadata.extra as Record<string, unknown> | null) ?? {}
          }
        : null
    };
  }

  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return 6371 * c;
  }
}
