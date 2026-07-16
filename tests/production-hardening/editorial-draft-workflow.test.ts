import assert from "node:assert/strict";
import test from "node:test";

import {
  assertEditorialDraftStatusTransition,
  isEditorialDraftPubliclyVisible,
} from "../../src/server/polibrawl/services/editorial/editorial-draft-workflow.shared";
import type { EditorialDraft } from "../../src/types/polibrawl";

function buildDraft(overrides: Partial<EditorialDraft> = {}): EditorialDraft {
  return {
    id: "draft-1",
    platform_id: "platform-1",
    red_flag_id: null,
    research_packet_id: "packet-1",
    draft_type: "platform_survival_guide",
    title: "PayPal Funds Hold Preparedness",
    summary:
      "Official policy language in this packet covers hold and reserve conditions that may affect access to funds before a fallback route is ready.",
    who_is_affected: ["Businesses using platform balances for operations"],
    why_it_matters:
      "If funds are less available than expected, near-term operating commitments can tighten quickly.",
    survival_actions: ["Export recent transaction records before a review starts."],
    checklist_items: [
      "Export recent transaction history.",
      "Preserve invoices and fulfillment proof.",
      "Maintain a secondary payout route.",
    ],
    backup_options: [
      {
        label: "Secondary processor",
        tradeoff: "Adds overhead, but reduces concentration risk.",
      },
    ],
    evidence_summary:
      "Selected official excerpts discuss reserves, hold conditions, and payout access during platform review.",
    evidence_reference_ids: ["evidence-1"],
    ai_confidence: 75,
    status: "draft",
    reviewed_at: null,
    published_at: null,
    archived_at: null,
    // Sprint 10.5 optional fields
    template_key: null,
    generation_context: null,
    critic_result: null,
    quality_evaluation: null,
    created_at: "2026-07-15T00:00:00.000Z",
    updated_at: "2026-07-15T00:00:00.000Z",
    ...overrides,
  };
}

test("editorial drafts cannot publish without prior approval", () => {
  assert.throws(
    () => assertEditorialDraftStatusTransition("draft", "published"),
    /cannot move from draft to published/i,
  );
});

test("editorial draft visibility stays false until a reviewed published state exists", () => {
  assert.equal(isEditorialDraftPubliclyVisible(buildDraft()), false);
  assert.equal(
    isEditorialDraftPubliclyVisible(
      buildDraft({
        status: "published",
        reviewed_at: "2026-07-15T00:00:00.000Z",
        published_at: "2026-07-15T00:00:00.000Z",
      }),
    ),
    true,
  );
});
