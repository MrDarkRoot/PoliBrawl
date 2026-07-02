import { z } from "zod";

import { evidenceStatuses } from "@/types/polibrawl";
import {
  isoDatetimeSchema,
  nullableTrimmedString,
  partialUpdateSchema,
  uuidSchema,
} from "@/features/shared/schemas/helpers";

export const createEvidenceSchema = z.object({
  red_flag_id: uuidSchema,
  source_id: uuidSchema,
  excerpt: z.string().trim().min(10).max(5000),
  source_title: z.string().trim().min(2).max(300),
  source_url: z.string().url().nullable().optional(),
  notes: nullableTrimmedString(2000),
  sort_order: z.number().int().min(0).default(0),
  status: z.enum(evidenceStatuses).default("draft"),
  reviewed_at: isoDatetimeSchema.nullable().optional(),
  published_at: isoDatetimeSchema.nullable().optional(),
  archived_at: isoDatetimeSchema.nullable().optional(),
});

export const updateEvidenceSchema = partialUpdateSchema(createEvidenceSchema.shape);

export const publishEvidenceSchema = z.object({
  status: z.literal("approved"),
  reviewed_at: isoDatetimeSchema,
  published_at: isoDatetimeSchema.optional(),
});

export type CreateEvidenceInput = z.infer<typeof createEvidenceSchema>;
export type UpdateEvidenceInput = z.infer<typeof updateEvidenceSchema>;
export type PublishEvidenceInput = z.infer<typeof publishEvidenceSchema>;
