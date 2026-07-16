import assert from "node:assert/strict";
import test from "node:test";

import { evaluatePolicyChangePublication } from "../../src/server/polibrawl/services/policy-change-publication.shared";
import type { PolicyChange } from "../../src/types/polibrawl";

function buildPolicyChange(overrides: Partial<PolicyChange> = {}): PolicyChange {
  return {
    id: "change-1",
    platform_id: "platform-1",
    source_id: "source-1",
    old_snapshot_id: "snapshot-old",
    new_snapshot_id: "snapshot-new",
    change_type: "verification_update",
    summary:
      "Stripe updated the wording around additional business verification requests for some accounts.",
    impact_level: "high",
    published_status: "published",
    what_changed:
      "The current official wording now says Stripe may request more business or identity information before continuing certain services.",
    who_is_affected: ["Business accounts undergoing verification review"],
    why_it_matters:
      "If Stripe is a primary payment rail, delayed verification responses can interrupt payment operations and payout planning.",
    what_to_do: [
      "Keep business ownership and identity documents current before a review begins.",
    ],
    reviewed_at: "2026-07-15T00:00:00.000Z",
    published_at: "2026-07-15T00:00:00.000Z",
    archived_at: null,
    created_at: "2026-07-15T00:00:00.000Z",
    updated_at: "2026-07-15T00:00:00.000Z",
    policy_source_id: null,
    old_version_id: null,
    new_version_id: null,
    old_hash: null,
    new_hash: null,
    detected_at: "2026-07-15T00:00:00.000Z",
    status: "reviewed",
    importance: "high",
    reviewed_by: null,
    ...overrides,
  };
}

test("policy change publication passes for complete published editorial records", () => {
  const result = evaluatePolicyChangePublication(buildPolicyChange());

  assert.equal(result.ready, true);
  assert.deepEqual(result.errors, []);
});

test("policy change publication blocks incomplete or draft records", () => {
  const result = evaluatePolicyChangePublication(
    buildPolicyChange({
      published_status: "draft",
      source_id: null,
      old_snapshot_id: null,
      new_snapshot_id: null,
      what_to_do: [],
    }),
  );

  assert.equal(result.ready, false);
  assert.match(result.errors.join(" "), /not published/i);
  assert.match(result.errors.join(" "), /official source reference/i);
  assert.match(result.errors.join(" "), /previous snapshot reference/i);
  assert.match(result.errors.join(" "), /action checklist/i);
});
