import { z } from "zod";

import {
  redFlagCategories,
  redFlagLevels,
  redFlagStatuses,
} from "@/types/polibrawl";
import {
  isoDatetimeSchema,
  partialUpdateSchema,
  slugSchema,
  uuidSchema,
} from "@/features/shared/schemas/helpers";

export const createRedFlagSchema = z.object({
  platform_id: uuidSchema,
  slug: slugSchema,
  title: z.string().trim().min(2).max(240),
  category: z.enum(redFlagCategories),
  level: z.enum(redFlagLevels),
  summary: z.string().trim().min(10).max(5000),
  why_it_matters: z.string().trim().min(10).max(5000),
  status: z.enum(redFlagStatuses).default("draft"),
  reviewed_at: isoDatetimeSchema.nullable().optional(),
  published_at: isoDatetimeSchema.nullable().optional(),
  archived_at: isoDatetimeSchema.nullable().optional(),
});

export const updateRedFlagSchema = partialUpdateSchema(createRedFlagSchema.shape);

export const publishRedFlagSchema = z.object({
  status: z.literal("published"),
  reviewed_at: isoDatetimeSchema,
  published_at: isoDatetimeSchema.optional(),
});

export type CreateRedFlagInput = z.infer<typeof createRedFlagSchema>;
export type UpdateRedFlagInput = z.infer<typeof updateRedFlagSchema>;
export type PublishRedFlagInput = z.infer<typeof publishRedFlagSchema>;
