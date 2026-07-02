"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAccess } from "@/lib/auth";
import {
  startReview,
  approveCandidate,
  rejectCandidate,
  mergeCandidate,
  returnToPending,
} from "@/server/polibrawl/repositories/candidate-review.repository";
import { reviewActionSchema } from "@/features/candidates/schemas/review.schema";

export type ReviewActionState = {
  message: string | null;
  error: string | null;
  success: boolean;
};

const initialReviewState: ReviewActionState = {
  message: null,
  error: null,
  success: false,
};

export async function processReviewAction(
  previousState: ReviewActionState = initialReviewState,
  formData: FormData,
): Promise<ReviewActionState> {
  void previousState;
  const session = await requireAdminAccess();
  // We'll use the user's ID from session if available, otherwise a placeholder for the smoke test/local env
  const reviewerId = (session.kind === "configured" && session.user?.id) 
    ? session.user.id 
    : "00000000-0000-0000-0000-000000000000";

  const parsed = reviewActionSchema.safeParse({
    candidateId: formData.get("candidateId"),
    action: formData.get("action"),
    note: formData.get("note"),
    reason: formData.get("reason"),
    targetCandidateId: formData.get("targetCandidateId"),
  });

  if (!parsed.success) {
    return {
      message: null,
      error: parsed.error.issues.map((i) => i.message).join("; "),
      success: false,
    };
  }

  try {
    const { candidateId, action, note, reason, targetCandidateId } = parsed.data;

    switch (action) {
      case "start":
        await startReview(candidateId, reviewerId);
        break;
      case "approve":
        await approveCandidate(candidateId, reviewerId, note);
        break;
      case "reject":
        if (!reason) throw new Error("Reject reason is required");
        await rejectCandidate(candidateId, reviewerId, reason);
        break;
      case "merge":
        if (!targetCandidateId) throw new Error("Target candidate is required for merge");
        await mergeCandidate(candidateId, targetCandidateId, reviewerId, note);
        break;
      case "pending":
        await returnToPending(candidateId, reviewerId);
        break;
    }

    revalidatePath("/admin/candidates");
    revalidatePath(`/admin/candidates/${candidateId}`);
    return {
      message: `Action '${action}' completed successfully.`,
      error: null,
      success: true,
    };
  } catch (err) {
    return {
      message: null,
      error: err instanceof Error ? err.message : "Unknown error during review action.",
      success: false,
    };
  }
}
