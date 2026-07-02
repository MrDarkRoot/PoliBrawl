import { z } from "zod";

import { notePriorities, survivalNoteStatuses } from "@/types/polibrawl";
import {
  isoDatetimeSchema,
  partialUpdateSchema,
  uuidSchema,
} from "@/features/shared/schemas/helpers";

export const createSurvivalNoteSchema = z.object({
  red_flag_id: uuidSchema,
  note_title: z.string().trim().min(2).max(240),
  note_body: z.string().trim().min(10).max(5000),
  priority: z.enum(notePriorities).default("medium"),
  status: z.enum(survivalNoteStatuses).default("draft"),
  published_at: isoDatetimeSchema.nullable().optional(),
  archived_at: isoDatetimeSchema.nullable().optional(),
});

export const updateSurvivalNoteSchema = partialUpdateSchema(
  createSurvivalNoteSchema.shape,
);

export const publishSurvivalNoteSchema = z.object({
  status: z.literal("published"),
  published_at: isoDatetimeSchema.optional(),
});

export type CreateSurvivalNoteInput = z.infer<typeof createSurvivalNoteSchema>;
export type UpdateSurvivalNoteInput = z.infer<typeof updateSurvivalNoteSchema>;
export type PublishSurvivalNoteInput = z.infer<typeof publishSurvivalNoteSchema>;
