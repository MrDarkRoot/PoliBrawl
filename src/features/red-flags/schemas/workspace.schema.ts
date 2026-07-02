import { z } from "zod";
import { uuidSchema } from "@/features/shared/schemas/helpers";

export const addEvidenceSchema = z.object({
  redFlagId: uuidSchema,
  title: z.string().min(1, "Title is required"),
  excerpt: z.string().min(1, "Excerpt is required"),
  confidence: z.enum(["low", "medium", "high"]),
  sourceId: uuidSchema,
});

export const addSurvivalNoteSchema = z.object({
  redFlagId: uuidSchema,
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  priority: z.enum(["low", "medium", "high"]),
});

export const addBackupOptionSchema = z.object({
  redFlagId: uuidSchema,
  name: z.string().min(1, "Name is required"),
  summary: z.string().min(1, "Summary is required"),
  tradeoffs: z.string().min(1, "Tradeoffs is required"),
  difficulty: z.string().optional(),
  cost_level: z.string().optional(),
  optionType: z.string(), // simplified
});

export const addChecklistItemSchema = z.object({
  checklistId: uuidSchema,
  text: z.string().min(1, "Text is required"),
  required: z.boolean().default(false),
});

export const deleteEvidenceSchema = z.object({
  id: uuidSchema,
  redFlagId: uuidSchema,
});
