import { z } from "zod";

import { uuidSchema } from "@/features/shared/schemas/helpers";

/**
 * Input schema for the keyword scanner action.
 */
export const scanSnapshotSchema = z.object({
  /** UUID of the source snapshot to scan. */
  sourceSnapshotId: uuidSchema,
  /**
   * When true (default), creates bounded RedFlagCandidate records after
   * inserting keyword_matches. Set to false for a dry-run match-only pass.
   */
  createCandidates: z.boolean().optional().default(true),
});

export type ScanSnapshotInput = z.infer<typeof scanSnapshotSchema>;
