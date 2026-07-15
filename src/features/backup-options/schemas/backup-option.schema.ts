import { z } from "zod";

import {
  backupOptionStatuses,
  backupOptionTypes,
} from "@/types/polibrawl";
import {
  isoDatetimeSchema,
  partialUpdateSchema,
  uuidSchema,
} from "@/features/shared/schemas/helpers";
import { optionalHttpUrlSchema } from "@/features/shared/schemas/http-url";

export const createBackupOptionSchema = z.object({
  platform_id: uuidSchema,
  label: z.string().trim().min(2).max(240),
  option_type: z.enum(backupOptionTypes),
  summary: z.string().trim().min(10).max(3000),
  tradeoffs: z.string().trim().min(10).max(3000),
  link_url: optionalHttpUrlSchema,
  status: z.enum(backupOptionStatuses).default("draft"),
  published_at: isoDatetimeSchema.nullable().optional(),
  archived_at: isoDatetimeSchema.nullable().optional(),
});

export const updateBackupOptionSchema = partialUpdateSchema(
  createBackupOptionSchema.shape,
);

export const publishBackupOptionSchema = z.object({
  status: z.literal("published"),
  published_at: isoDatetimeSchema.optional(),
});

export type CreateBackupOptionInput = z.infer<typeof createBackupOptionSchema>;
export type UpdateBackupOptionInput = z.infer<typeof updateBackupOptionSchema>;
export type PublishBackupOptionInput = z.infer<typeof publishBackupOptionSchema>;
