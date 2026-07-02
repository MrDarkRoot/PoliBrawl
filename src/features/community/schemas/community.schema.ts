import { z } from "zod";

import {
  communitySubmissionStatuses,
  correctionIssueTypes,
  correctionStatuses,
  platformWatcherStatuses,
  redFlagCategories,
} from "@/types/polibrawl";
import {
  isoDatetimeSchema,
  nullableTrimmedString,
  partialUpdateSchema,
  uuidSchema,
} from "@/features/shared/schemas/helpers";

const reviewRequestShape = {
  platform_id: uuidSchema.nullable().optional(),
  platform_name: z.string().trim().min(2).max(160).nullable().optional(),
  email: z.string().email().max(254).nullable().optional(),
  message: nullableTrimmedString(2000),
  status: z.enum(communitySubmissionStatuses).default("pending"),
  reviewed_at: isoDatetimeSchema.nullable().optional(),
  archived_at: isoDatetimeSchema.nullable().optional(),
};

export const createReviewRequestSchema = z
  .object(reviewRequestShape)
  .refine((value) => value.platform_id || value.platform_name, {
    message: "Provide platform_id or platform_name.",
    path: ["platform_id"],
  });

export const updateReviewRequestSchema = partialUpdateSchema(reviewRequestShape);

export const createPlatformWatcherSchema = z.object({
  platform_id: uuidSchema,
  email: z.string().email().max(254),
  status: z.enum(platformWatcherStatuses).default("pending"),
  subscribed_at: isoDatetimeSchema.optional(),
  unsubscribed_at: isoDatetimeSchema.nullable().optional(),
  archived_at: isoDatetimeSchema.nullable().optional(),
});

export const updatePlatformWatcherSchema = partialUpdateSchema(
  createPlatformWatcherSchema.shape,
);

export const createExperienceSubmissionSchema = z.object({
  platform_id: uuidSchema,
  category: z.enum([...redFlagCategories, "other"] as const),
  summary: z.string().trim().min(10).max(5000),
  country: nullableTrimmedString(120),
  amount_range: nullableTrimmedString(120),
  evidence_note: nullableTrimmedString(2000),
  status: z.enum(communitySubmissionStatuses).default("pending"),
  reviewed_at: isoDatetimeSchema.nullable().optional(),
  published_at: isoDatetimeSchema.nullable().optional(),
  archived_at: isoDatetimeSchema.nullable().optional(),
});

export const updateExperienceSubmissionSchema = partialUpdateSchema(
  createExperienceSubmissionSchema.shape,
);

export const publishExperienceSubmissionSchema = z.object({
  status: z.literal("published_summary"),
  published_at: isoDatetimeSchema.optional(),
});

export const createSurvivalTipSubmissionSchema = z.object({
  platform_id: uuidSchema,
  tip_summary: z.string().trim().min(10).max(1000),
  details: nullableTrimmedString(3000),
  status: z.enum(communitySubmissionStatuses).default("pending"),
  reviewed_at: isoDatetimeSchema.nullable().optional(),
  published_at: isoDatetimeSchema.nullable().optional(),
  archived_at: isoDatetimeSchema.nullable().optional(),
});

export const updateSurvivalTipSubmissionSchema = partialUpdateSchema(
  createSurvivalTipSubmissionSchema.shape,
);

export const publishSurvivalTipSubmissionSchema = z.object({
  status: z.literal("published_summary"),
  published_at: isoDatetimeSchema.optional(),
});

export const createCorrectionSchema = z.object({
  platform_id: uuidSchema.nullable().optional(),
  issue_type: z.enum(correctionIssueTypes),
  message: z.string().trim().min(10).max(4000),
  source_url: z.string().url().nullable().optional(),
  contact_email: z.string().email().max(254).nullable().optional(),
  status: z.enum(correctionStatuses).default("pending"),
  reviewed_at: isoDatetimeSchema.nullable().optional(),
  resolved_at: isoDatetimeSchema.nullable().optional(),
  archived_at: isoDatetimeSchema.nullable().optional(),
});

export const updateCorrectionSchema = partialUpdateSchema(
  createCorrectionSchema.shape,
);

export type CreateReviewRequestInput = z.infer<typeof createReviewRequestSchema>;
export type UpdateReviewRequestInput = z.infer<typeof updateReviewRequestSchema>;
export type CreatePlatformWatcherInput = z.infer<typeof createPlatformWatcherSchema>;
export type UpdatePlatformWatcherInput = z.infer<typeof updatePlatformWatcherSchema>;
export type CreateExperienceSubmissionInput = z.infer<
  typeof createExperienceSubmissionSchema
>;
export type UpdateExperienceSubmissionInput = z.infer<
  typeof updateExperienceSubmissionSchema
>;
export type PublishExperienceSubmissionInput = z.infer<
  typeof publishExperienceSubmissionSchema
>;
export type CreateSurvivalTipSubmissionInput = z.infer<
  typeof createSurvivalTipSubmissionSchema
>;
export type UpdateSurvivalTipSubmissionInput = z.infer<
  typeof updateSurvivalTipSubmissionSchema
>;
export type PublishSurvivalTipSubmissionInput = z.infer<
  typeof publishSurvivalTipSubmissionSchema
>;
export type CreateCorrectionInput = z.infer<typeof createCorrectionSchema>;
export type UpdateCorrectionInput = z.infer<typeof updateCorrectionSchema>;
