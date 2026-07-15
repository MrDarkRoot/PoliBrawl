import { z } from "zod";

import { platformCategories, platformStatuses } from "@/lib/constants";
import { httpUrlSchema } from "@/features/shared/schemas/http-url";

export const platformSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only."),
  website_url: httpUrlSchema,
  category: z.enum(platformCategories),
  country: z.string().trim().max(120).optional().nullable(),
  status: z.enum(platformStatuses),
  summary: z.string().trim().max(5000).optional().nullable(),
  internal_notes: z.string().trim().max(10000).optional().nullable(),
  last_reviewed_at: z.string().datetime().optional().nullable(),
});

export type PlatformInput = z.infer<typeof platformSchema>;

export const platformStatusSchema = z.object({
  status: z.enum(platformStatuses),
});
