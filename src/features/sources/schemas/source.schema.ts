import { z } from "zod";

import { sourcePriorities, sourceStatuses, sourceTypes } from "@/types/polibrawl";
import {
  isoDatetimeSchema,
  nullableTrimmedString,
  partialUpdateSchema,
  uuidSchema,
} from "@/features/shared/schemas/helpers";

export const createSourceSchema = z.object({
  platform_id: uuidSchema,
  source_type: z.enum(sourceTypes),
  priority: z.enum(sourcePriorities).default("supporting"),
  title: z.string().trim().min(2).max(300),
  url: z.string().url().nullable().optional(),
  body_text: z.string().trim().min(10).nullable().optional(),
  status: z.enum(sourceStatuses).default("draft"),
  notes: nullableTrimmedString(10000),
  captured_at: isoDatetimeSchema.nullable().optional(),
  reviewed_at: isoDatetimeSchema.nullable().optional(),
  archived_at: isoDatetimeSchema.nullable().optional(),
});

export const updateSourceSchema = partialUpdateSchema(createSourceSchema.shape);

export type CreateSourceInput = z.infer<typeof createSourceSchema>;
export type UpdateSourceInput = z.infer<typeof updateSourceSchema>;
