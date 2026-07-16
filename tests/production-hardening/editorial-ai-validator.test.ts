import assert from "node:assert/strict";
import test from "node:test";

import { validateEditorialAiDraftCandidate } from "../../src/server/polibrawl/services/editorial/editorial-ai-validator.service";

function buildCandidate() {
  return {
    title: "PayPal Funds Hold Preparedness",
    summary:
      "Official policy language in this packet covers hold and reserve conditions that may affect access to funds before a business can improvise another route.",
    who_is_affected: [
      "Businesses relying on platform balances for operating cash flow",
    ],
    why_it_matters:
      "If funds become less available than expected, payroll and supplier commitments can tighten before the review path is clear.",
    survival_actions: [
      "Prepare recent transaction records before a review starts.",
    ],
    checklist_items: [
      "Export recent transaction history.",
      "Preserve invoices and fulfillment proof.",
      "Maintain a secondary payout route.",
    ],
    backup_options: [
      {
        label: "Secondary payment processor",
        tradeoff:
          "Adds onboarding overhead, but reduces dependence on one collection rail.",
      },
    ],
    evidence_summary:
      "Selected official excerpts discuss reserves, hold conditions, and payout access during platform review.",
    ai_confidence: 72,
    evidence_reference_ids: ["evidence-1"],
  };
}

test("editorial AI validator rejects unsupported guarantee language", () => {
  const result = validateEditorialAiDraftCandidate(
    {
      ...buildCandidate(),
      summary:
        "This guaranteed recovery path always returns funds after review and will recover your money.",
    },
    ["evidence-1"],
  );

  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /forbidden claim language/i);
});

test("editorial AI validator rejects drafts without evidence references", () => {
  const result = validateEditorialAiDraftCandidate(
    {
      ...buildCandidate(),
      evidence_reference_ids: [],
    },
    ["evidence-1"],
  );

  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /at least one evidence excerpt/i);
});
