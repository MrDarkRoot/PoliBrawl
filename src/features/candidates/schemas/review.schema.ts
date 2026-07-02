import { z } from "zod";
import { uuidSchema } from "@/features/shared/schemas/helpers";

export const reviewActionSchema = z.object({
  candidateId: uuidSchema,
  action: z.enum(["start", "approve", "reject", "merge", "pending"]),
  note: z.string().optional(),
  reason: z.string().optional(), // For reject
  targetCandidateId: uuidSchema.optional(), // For merge
});

export type ReviewActionInput = z.infer<typeof reviewActionSchema>;
