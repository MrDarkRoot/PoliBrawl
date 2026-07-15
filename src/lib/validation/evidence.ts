import { z } from "zod";

import { httpUrlSchema } from "@/features/shared/schemas/http-url";
import { evidenceStatuses, evidenceVisibilityLevels, signalConfidenceLevels, signalLevels, signalCategories } from "@/lib/constants";

export const signalApprovalSchema = z.object({
  name: z.string().trim().min(2).max(200),
  category: z.enum(signalCategories),
  level: z.enum(signalLevels),
  confidence: z.enum(signalConfidenceLevels),
  explanation: z.string().trim().max(6000).optional().nullable(),
  internal_reason: z.string().trim().max(6000).optional().nullable(),
});

export type SignalApprovalInput = z.infer<typeof signalApprovalSchema>;

export const evidenceSchema = z.object({
  clause_id: z.string().uuid().optional().nullable(),
  policy_source_id: z.string().uuid(),
  document_version_id: z.string().uuid().optional().nullable(),
  clause_excerpt: z.string().trim().min(10),
  source_url: httpUrlSchema,
  document_title: z.string().trim().max(300).optional().nullable(),
  review_date: z.string().date(),
  explanation: z.string().trim().min(10).max(6000),
  why_it_matters: z.string().trim().max(6000).optional().nullable(),
  visibility: z.enum(evidenceVisibilityLevels),
  status: z.enum(evidenceStatuses),
});

export type EvidenceInput = z.infer<typeof evidenceSchema>;
