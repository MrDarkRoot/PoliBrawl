import { z } from "zod";
import { uuidSchema } from "@/features/shared/schemas/helpers";

export const createSurvivalPageSchema = z.object({
  platformId: uuidSchema,
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  summary: z.string().optional().nullable(),
  main_level: z.string().optional().nullable(),
  editorial_intro: z.string().optional().nullable(),
  survival_summary: z.string().optional().nullable(),
  disclaimer_note: z.string().optional().nullable(),
  last_reviewed_at: z.string().optional().nullable(),
});

export const updateSurvivalPageSchema = z.object({
  id: uuidSchema,
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  summary: z.string().optional().nullable(),
  main_level: z.string().optional().nullable(),
  editorial_intro: z.string().optional().nullable(),
  survival_summary: z.string().optional().nullable(),
  disclaimer_note: z.string().optional().nullable(),
  last_reviewed_at: z.string().optional().nullable(),
});

export const attachRedFlagSchema = z.object({
  pageId: uuidSchema,
  redFlagId: uuidSchema,
});

export const detachRedFlagSchema = z.object({
  pageId: uuidSchema,
  redFlagId: uuidSchema,
});

export const reorderRedFlagsSchema = z.object({
  pageId: uuidSchema,
  orderedRedFlagIds: z.array(uuidSchema),
});
