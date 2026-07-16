import { z } from "zod";

import type { EditorialDraftType } from "@/types/polibrawl";

export const editorialDraftBackupOptionSchema = z.object({
  label: z.string().trim().min(2).max(120),
  tradeoff: z.string().trim().min(10).max(500),
});

export const editorialDraftOutputSchema = z.object({
  title: z.string().trim().min(5).max(200),
  summary: z.string().trim().min(30).max(2000),
  who_is_affected: z.array(z.string().trim().min(3).max(240)).min(1).max(8),
  why_it_matters: z.string().trim().min(30).max(2500),
  survival_actions: z.array(z.string().trim().min(5).max(500)).min(1).max(8),
  checklist_items: z.array(z.string().trim().min(5).max(500)).min(3).max(12),
  backup_options: z.array(editorialDraftBackupOptionSchema).min(1).max(4),
  evidence_summary: z.string().trim().min(20).max(2500),
  ai_confidence: z.number().int().min(0).max(100),
});

export type EditorialDraftTemplateOutput = z.infer<
  typeof editorialDraftOutputSchema
>;

export type EditorialTemplateDefinition = {
  draftType: EditorialDraftType;
  systemInstructions: string;
  requiredFields: readonly (keyof EditorialDraftTemplateOutput)[];
  forbiddenClaims: readonly string[];
  outputSchema: typeof editorialDraftOutputSchema;
};

export const defaultForbiddenClaims = [
  "guaranteed",
  "will recover",
  "always",
  "never",
  "legal advice",
  "we promise",
] as const;
