import { z } from "zod";

const PublicUrlSchema = z.string().refine((value) => {
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}, "publicUrl must be a valid http/https URL (ports are supported)");

export const GeoSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusKm: z.number().positive().optional()
});

export const CapabilitySchema = z.object({
  name: z.string().min(1).max(100),
  version: z.string().max(40).optional(),
  actions: z.array(z.string().min(1).max(120)).optional()
});

export const AgentMetadataSchema = z.object({
  tags: z.array(z.string().min(1).max(64)).max(50).optional(),
  categories: z.array(z.string().min(1).max(64)).max(50).optional(),
  locales: z.array(z.string().min(2).max(35)).max(50).optional(),
  geo: GeoSchema.optional(),
  business: z
    .object({
      cuisines: z.array(z.string().min(1).max(64)).max(30).optional(),
      serviceArea: z.string().max(160).optional()
    })
    .optional(),
  extra: z.record(z.any()).optional()
});

export const RegisterAgentBodySchema = z.object({
  registrationCode: z.string().min(3).max(255).optional(),
  displayName: z.string().min(2).max(120),
  agentType: z.enum(["personal", "entity"]),
  publicUrl: PublicUrlSchema.optional(),
  capabilities: z.array(CapabilitySchema).min(1).max(200),
  metadata: AgentMetadataSchema
});

export const ClaimHandleBodySchema = z.object({
  handle: z
    .string()
    .regex(/^[a-z0-9_]{3,30}$/)
});

export const StructuredDiscoveryFiltersSchema = z.object({
  capability: z.string().optional(),
  tags: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  cuisine: z.string().optional(),
  geo: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      radiusKm: z.number().positive().max(1000)
    })
    .optional(),
  limit: z.number().int().min(1).max(100).default(20)
});

export const IntentFiltersSchema = z.object({
  capability: z.string().optional(),
  cuisine: z.string().optional(),
  tags: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  geo: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      radiusKm: z.number().positive().max(1000)
    })
    .optional(),
  desiredTimeLocal: z.string().max(80).optional(),
  desiredDayOfWeek: z.string().max(20).optional(),
  limit: z.number().int().min(1).max(100).default(20)
});

export type IntentFilters = z.infer<typeof IntentFiltersSchema>;
export type StructuredDiscoveryFilters = z.infer<typeof StructuredDiscoveryFiltersSchema>;
export type RegisterAgentBody = z.infer<typeof RegisterAgentBodySchema>;

export type AdminLoginBody = {
  password: string;
};

export type RegistrationMode = "open" | "code_required";

export type AgentListItem = {
  id: string;
  displayName: string;
  handle: string | null;
  agentType: "personal" | "entity";
  capabilitiesCount: number;
  tags: string[];
  createdAt: string;
  lastSeenAt: string | null;
  status: "active" | "revoked" | "pending";
};
