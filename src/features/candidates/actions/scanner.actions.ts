"use server";

import { requireAdminAccess } from "@/lib/auth";
import { scanSourceSnapshotForKeywords } from "@/server/polibrawl/services/keyword-scanner.service";
import { scanSnapshotSchema } from "@/features/candidates/schemas/scanner.schema";
import type { ScanSnapshotResult } from "@/types/polibrawl";

export type ScanActionState = {
  message: string | null;
  result: ScanSnapshotResult | null;
  error: string | null;
};

const initialScanActionState: ScanActionState = {
  message: null,
  result: null,
  error: null,
};

/**
 * Server action: run the keyword scanner on a source snapshot.
 * Admin-only. Returns a scan summary — does not redirect.
 */
export async function scanSourceSnapshotAction(
  previousState: ScanActionState = initialScanActionState,
  formData: FormData,
): Promise<ScanActionState> {
  void previousState;
  await requireAdminAccess();

  const parsed = scanSnapshotSchema.safeParse({
    sourceSnapshotId: formData.get("sourceSnapshotId"),
    createCandidates: formData.get("createCandidates") !== "false",
  });

  if (!parsed.success) {
    return {
      message: null,
      result: null,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  try {
    const result = await scanSourceSnapshotForKeywords(parsed.data);
    return {
      message: `Scan complete. ${result.matchesInserted} matches inserted, ${result.candidatesCreated} candidates created, ${result.duplicatesSkipped} duplicates skipped.`,
      result,
      error: null,
    };
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Unknown error during scan.";
    return {
      message: null,
      result: null,
      error: msg,
    };
  }
}
