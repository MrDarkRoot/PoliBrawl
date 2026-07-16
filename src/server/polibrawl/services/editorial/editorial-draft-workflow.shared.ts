import type { EditorialDraft, EditorialDraftStatus } from "@/types/polibrawl";

export type EditorialDraftPublicationReadiness = {
  ready: boolean;
  errors: string[];
};

const allowedTransitions: Record<EditorialDraftStatus, readonly EditorialDraftStatus[]> = {
  draft: ["draft", "review_requested", "rejected"],
  review_requested: ["draft", "review_requested", "approved", "rejected"],
  approved: ["draft", "review_requested", "approved", "published", "rejected"],
  published: ["published"],
  rejected: ["draft", "review_requested", "rejected"],
};

export function canTransitionEditorialDraftStatus(
  currentStatus: EditorialDraftStatus,
  nextStatus: EditorialDraftStatus,
) {
  return allowedTransitions[currentStatus].includes(nextStatus);
}

export function assertEditorialDraftStatusTransition(
  currentStatus: EditorialDraftStatus,
  nextStatus: EditorialDraftStatus,
) {
  if (!canTransitionEditorialDraftStatus(currentStatus, nextStatus)) {
    throw new Error(
      `Editorial draft cannot move from ${currentStatus} to ${nextStatus}.`,
    );
  }
}

export function evaluateEditorialDraftPublication(
  draft: EditorialDraft | null,
): EditorialDraftPublicationReadiness {
  if (!draft) {
    return {
      ready: false,
      errors: ["Missing editorial draft."],
    };
  }

  const errors: string[] = [];

  if (draft.archived_at) {
    errors.push("Editorial draft is archived.");
  }

  if (draft.status !== "published") {
    errors.push("Editorial draft is not published.");
  }

  if (!draft.reviewed_at) {
    errors.push("Editorial draft is missing reviewed_at.");
  }

  if (!draft.published_at) {
    errors.push("Editorial draft is missing published_at.");
  }

  return {
    ready: errors.length === 0,
    errors,
  };
}

export function isEditorialDraftPubliclyVisible(draft: EditorialDraft | null) {
  return evaluateEditorialDraftPublication(draft).ready;
}
