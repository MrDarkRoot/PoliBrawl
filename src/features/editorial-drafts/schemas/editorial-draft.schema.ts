import { z } from "zod";

import {
  editorialDraftStatuses,
} from "@/types/polibrawl";
import {
  parseBackupOptionsInput,
  splitTextareaLines,
} from "@/features/editorial-drafts/editorial-draft-formats";

const optionalTextSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null));

const textListSchema = z.preprocess(
  (value) => splitTextareaLines(typeof value === "string" ? value : ""),
  z.array(z.string().trim().min(1)),
);

const backupOptionsSchema = z.preprocess(
  (value) => parseBackupOptionsInput(typeof value === "string" ? value : ""),
  z.array(
    z.object({
      label: z.string().trim().min(2, "Each backup option needs a label before the pipe."),
      tradeoff: z
        .string()
        .trim()
        .min(10, "Each backup option needs a tradeoff after the pipe."),
    }),
  ),
);

export const editorialDraftFormSchema = z.object({
  title: z.string().trim().min(5).max(200),
  summary: z.string().trim().min(40).max(2000),
  who_is_affected: textListSchema,
  why_it_matters: z.string().trim().min(40).max(2500),
  survival_actions: textListSchema,
  checklist_items: textListSchema,
  backup_options: backupOptionsSchema,
  evidence_summary: z.string().trim().min(20).max(2500),
  ai_confidence: z.coerce.number().int().min(0).max(100),
  status: z.enum(editorialDraftStatuses),
  reviewed_at: optionalTextSchema,
  published_at: optionalTextSchema,
});
