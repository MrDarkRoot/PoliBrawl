import { z } from "zod";

import {
  platformCategories,
  platformStatuses,
} from "@/types/polibrawl";
import {
  isoDatetimeSchema,
  nullableTrimmedString,
  partialUpdateSchema,
  slugSchema,
} from "@/features/shared/schemas/helpers";

export const createPlatformSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(2).max(160),
  category: z.enum(platformCategories),
  status: z.enum(platformStatuses).default("draft"),
  website_url: z.string().url(),
  summary: nullableTrimmedString(5000),
  disclaimer_text: nullableTrimmedString(5000),
  internal_notes: nullableTrimmedString(10000),
  last_reviewed_at: isoDatetimeSchema.nullable().optional(),
  published_at: isoDatetimeSchema.nullable().optional(),
  archived_at: isoDatetimeSchema.nullable().optional(),
});

export const updatePlatformSchema = partialUpdateSchema(createPlatformSchema.shape);

export const publishPlatformSchema = z.object({
  status: z.literal("published"),
  summary: z.string().trim().min(1).max(5000),
  disclaimer_text: z.string().trim().min(1).max(5000),
  last_reviewed_at: isoDatetimeSchema,
  published_at: isoDatetimeSchema.optional(),
});

export type CreatePlatformInput = z.infer<typeof createPlatformSchema>;
export type UpdatePlatformInput = z.infer<typeof updatePlatformSchema>;
export type PublishPlatformInput = z.infer<typeof publishPlatformSchema>;
