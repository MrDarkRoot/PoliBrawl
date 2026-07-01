import { z } from "zod";

import { signalCategories, signalLevels } from "@/lib/constants";

export const ruleSchema = z.object({
  rule_name: z.string().trim().min(2).max(200),
  category: z.enum(signalCategories),
  signal_name: z.string().trim().min(2).max(200),
  keywords: z.array(z.string().trim().min(1)).default([]),
  regex_patterns: z.array(z.string().trim().min(1)).default([]),
  suggested_level: z.enum(signalLevels),
  confidence_weight: z.number().min(0).max(1),
  false_positive_notes: z.string().trim().max(4000).optional().nullable(),
  enabled: z.boolean().default(true),
});

export type RuleInput = z.infer<typeof ruleSchema>;
