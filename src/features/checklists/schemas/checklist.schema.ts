import { z } from "zod";

import { checklistItemStatuses, checklistStatuses } from "@/types/polibrawl";
import {
  isoDatetimeSchema,
  nullableTrimmedString,
  partialUpdateSchema,
  uuidSchema,
} from "@/features/shared/schemas/helpers";

export const createChecklistSchema = z.object({
  platform_id: uuidSchema,
  title: z.string().trim().min(2).max(240),
  intro: nullableTrimmedString(3000),
  status: z.enum(checklistStatuses).default("draft"),
  published_at: isoDatetimeSchema.nullable().optional(),
  archived_at: isoDatetimeSchema.nullable().optional(),
});

export const updateChecklistSchema = partialUpdateSchema(createChecklistSchema.shape);

export const publishChecklistSchema = z.object({
  status: z.literal("published"),
  published_at: isoDatetimeSchema.optional(),
});

export const createChecklistItemSchema = z.object({
  checklist_id: uuidSchema,
  label: z.string().trim().min(2).max(240),
  details: nullableTrimmedString(2000),
  sort_order: z.number().int().min(0).default(0),
  status: z.enum(checklistItemStatuses).default("draft"),
  published_at: isoDatetimeSchema.nullable().optional(),
  archived_at: isoDatetimeSchema.nullable().optional(),
});

export const updateChecklistItemSchema = partialUpdateSchema(
  createChecklistItemSchema.shape,
);

export const publishChecklistItemSchema = z.object({
  status: z.literal("published"),
  published_at: isoDatetimeSchema.optional(),
});

export type CreateChecklistInput = z.infer<typeof createChecklistSchema>;
export type UpdateChecklistInput = z.infer<typeof updateChecklistSchema>;
export type PublishChecklistInput = z.infer<typeof publishChecklistSchema>;
export type CreateChecklistItemInput = z.infer<typeof createChecklistItemSchema>;
export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>;
export type PublishChecklistItemInput = z.infer<typeof publishChecklistItemSchema>;
