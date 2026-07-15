import { z } from "zod";

import {
  redFlagLevels,
} from "@/types/polibrawl";
import { parseTimelineEventsInput, splitTextareaLines } from "@/features/platform-intelligence/intelligence-formats";

const editableStatusSchema = z.enum(["draft", "published"]);

const optionalTextSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null));

const textListSchema = z.preprocess(
  (value) => splitTextareaLines(typeof value === "string" ? value : ""),
  z.array(z.string().trim().min(1)),
);

const timelineEventsSchema = z.preprocess(
  (value) => parseTimelineEventsInput(typeof value === "string" ? value : ""),
  z
    .array(
      z.object({
        label: z.string().trim().min(1, "Each timeline event needs a time label before the pipe."),
        detail: z.string().trim().min(1, "Each timeline event needs a description after the pipe."),
      }),
    )
    .min(1, "Add at least one timeline event."),
);

export const resolutionRouteFormSchema = z.object({
  organization_name: z.string().trim().min(1).max(200),
  organization_type: z.string().trim().min(1).max(200),
  country: optionalTextSchema,
  jurisdiction: optionalTextSchema,
  official_url: z.string().trim().url(),
  eligible_users: textListSchema,
  eligible_disputes: textListSchema,
  requirements: textListSchema,
  steps: textListSchema,
  fees: optionalTextSchema,
  limits: optionalTextSchema,
  deadline: optionalTextSchema,
  verification_source: z.string().trim().min(1).max(500),
  last_verified_at: optionalTextSchema,
  status: editableStatusSchema,
  display_order: z.coerce.number().int().min(0).default(0),
});

export const dependencyScoreFormSchema = z.object({
  score: z.coerce.number().int().min(0).max(100),
  risk_level: z.enum(redFlagLevels),
  factors: textListSchema,
  explanation: z.string().trim().min(1).max(5000),
  generated_at: optionalTextSchema,
  status: editableStatusSchema,
});

export const riskTimelineFormSchema = z.object({
  title: z.string().trim().min(1).max(200),
  events: timelineEventsSchema,
  source: z.string().trim().min(1).max(1000),
  status: editableStatusSchema,
  display_order: z.coerce.number().int().min(0).default(0),
});

export const evidenceConfidenceFormSchema = z.object({
  score: z.coerce.number().int().min(0).max(100),
  factors: textListSchema,
  last_verified_at: optionalTextSchema,
  status: editableStatusSchema,
});
