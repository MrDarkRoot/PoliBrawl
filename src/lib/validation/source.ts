import { z } from "zod";

import { documentTypes, sourceStatuses, sourceTiers } from "@/lib/constants";

export const sourceSchema = z.object({
  platform_id: z.string().uuid(),
  title: z.string().trim().max(300).optional().nullable(),
  url: z.string().url(),
  final_url: z.string().url().optional().nullable(),
  document_type: z.enum(documentTypes),
  source_tier: z.enum(sourceTiers),
  use_for_scoring: z.boolean(),
  monitor_enabled: z.boolean(),
  status: z.enum(sourceStatuses),
  last_reviewed_at: z.string().datetime().optional().nullable(),
});

export type SourceInput = z.infer<typeof sourceSchema>;

export const sourceImportSchema = z.object({
  markdown_text: z.string().trim().min(10),
  plain_text: z.string().trim().min(10).optional().nullable(),
  extraction_method: z.string().trim().min(2).max(100).default("manual_import"),
  effective_date: z.string().date().optional().nullable(),
});

export type SourceImportInput = z.infer<typeof sourceImportSchema>;
