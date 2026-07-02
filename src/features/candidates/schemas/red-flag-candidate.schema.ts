import { z } from "zod";

import {
  redFlagCandidateStatuses,
  redFlagCategories,
} from "@/types/polibrawl";
import {
  isoDatetimeSchema,
  nullableTrimmedString,
  partialUpdateSchema,
  uuidSchema,
} from "@/features/shared/schemas/helpers";

export const createRedFlagCandidateSchema = z.object({
  platform_id: uuidSchema,
  source_id: uuidSchema,
  category: z.enum(redFlagCategories),
  headline: z.string().trim().min(2).max(240),
  excerpt: z.string().trim().min(10).max(5000),
  matched_keywords: z.array(z.string().trim().min(1).max(120)).default([]),
  confidence_note: nullableTrimmedString(1000),
  reviewer_notes: nullableTrimmedString(2000),
  status: z.enum(redFlagCandidateStatuses).default("pending"),
  reviewed_at: isoDatetimeSchema.nullable().optional(),
  archived_at: isoDatetimeSchema.nullable().optional(),
});

export const updateRedFlagCandidateSchema = partialUpdateSchema(
  createRedFlagCandidateSchema.shape,
);

export type CreateRedFlagCandidateInput = z.infer<
  typeof createRedFlagCandidateSchema
>;
export type UpdateRedFlagCandidateInput = z.infer<
  typeof updateRedFlagCandidateSchema
>;
