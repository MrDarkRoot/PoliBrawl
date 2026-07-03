import { z } from "zod";

import {
  captureMethods,
  sourcePriorities,
  sourceStatuses,
  sourceTypes,
} from "@/types/polibrawl";
import {
  isoDatetimeSchema,
  nullableTrimmedString,
  partialUpdateSchema,
  uuidSchema,
} from "@/features/shared/schemas/helpers";

const httpUrlSchema = z
  .string()
  .trim()
  .url()
  .refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  }, "Use an http or https URL.");

export const createSourceSchema = z
  .object({
    platform_id: uuidSchema,
    source_type: z.enum(sourceTypes),
    priority: z.enum(sourcePriorities).default("supporting"),
    title: z.string().trim().min(2).max(300),
    url: httpUrlSchema.nullable().optional(),
    status: z.enum(sourceStatuses).default("draft"),
    notes: nullableTrimmedString(10000),
    last_reviewed_at: isoDatetimeSchema.nullable().optional(),
  })
  .strict();

export const updateSourceSchema = partialUpdateSchema(createSourceSchema.shape);

export const archiveSourceSchema = z
  .object({
    source_id: uuidSchema,
  })
  .strict();

export const captureFetchSourceSchema = z
  .object({
    source_id: uuidSchema,
    capture_method: z.literal(captureMethods[0]),
    url: httpUrlSchema,
    title: nullableTrimmedString(300),
  })
  .strict();

export const capturePasteSourceSchema = z
  .object({
    source_id: uuidSchema,
    capture_method: z.literal(captureMethods[1]),
    pasted_text: z.string().trim().min(1).max(500_000),
    title: nullableTrimmedString(300),
    original_url: httpUrlSchema.nullable().optional(),
  })
  .strict();

export const acquireSourceSchema = z
  .object({
    source_id: uuidSchema,
    method: z.enum(["auto", "http", "browser", "paste", "upload_html", "upload_text"]).default("auto"),
    url: httpUrlSchema.nullable().optional(),
    pastedText: z.string().trim().max(500_000).optional(),
    uploadedContent: z.string().trim().max(500_000).optional(),
    uploadedFilename: z.string().trim().max(300).optional(),
  })
  .strict();

export type CreateSourceInput = z.infer<typeof createSourceSchema>;
export type UpdateSourceInput = z.infer<typeof updateSourceSchema>;
export type ArchiveSourceInput = z.infer<typeof archiveSourceSchema>;
export type CaptureFetchSourceInput = z.infer<typeof captureFetchSourceSchema>;
export type CapturePasteSourceInput = z.infer<typeof capturePasteSourceSchema>;
export type AcquireSourceInput = z.infer<typeof acquireSourceSchema>;
