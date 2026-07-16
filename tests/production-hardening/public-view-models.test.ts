import assert from "node:assert/strict";
import test from "node:test";

import {
  toPublicPolicyChangeDetail,
  toPublicPageRedFlag,
  toPublicPlatformDnaFlags,
} from "../../src/server/polibrawl/services/public-view-models.shared";
import type { PolicyChange, RedFlag } from "../../src/types/polibrawl";

function buildRawRedFlag(
  overrides: Partial<RedFlag & { section_label: string | null }> = {},
): RedFlag & { section_label: string | null } {
  return {
    id: "red-flag-1",
    platform_id: "platform-1",
    slug: "account-limitation",
    title: "Account limitation",
    category: "account",
    level: "high",
    summary:
      "A limitation can interrupt withdrawals, payments, or account operations while the platform requests more information.",
    why_it_matters:
      "The business impact arrives before you can improvise a second route, so documentation and backup rails must exist first.",
    status: "published",
    reviewed_at: "2026-07-15T00:00:00.000Z",
    published_at: "2026-07-15T00:00:00.000Z",
    archived_at: null,
    excerpt: "Internal excerpt",
    source_id: "source-1",
    source_snapshot_id: "snapshot-1",
    keywords: ["hold", "limitation"],
    primary_evidence_reference: "packet-1",
    created_at: "2026-07-15T00:00:00.000Z",
    updated_at: "2026-07-15T00:00:00.000Z",
    section_label: "Account access",
    ...overrides,
  };
}

test("public red flag view model strips internal pipeline fields", () => {
  const shaped = toPublicPageRedFlag(buildRawRedFlag());

  assert.deepEqual(Object.keys(shaped).sort(), [
    "category",
    "id",
    "level",
    "platform_id",
    "section_label",
    "slug",
    "summary",
    "title",
    "why_it_matters",
  ]);

  const serialized = JSON.stringify(shaped);

  assert.doesNotMatch(serialized, /source_snapshot_id/);
  assert.doesNotMatch(serialized, /primary_evidence_reference/);
  assert.doesNotMatch(serialized, /keywords/);
  assert.doesNotMatch(serialized, /reviewed_at/);
});

test("platform DNA client props never include internal metadata", () => {
  const publicFlags = [toPublicPageRedFlag(buildRawRedFlag())];
  const clientProps = toPublicPlatformDnaFlags(publicFlags);

  assert.deepEqual(clientProps, [
    {
      category: "account",
      level: "high",
      title: "Account limitation",
    },
  ]);

  const serialized = JSON.stringify(clientProps);

  assert.doesNotMatch(serialized, /source_snapshot_id/);
  assert.doesNotMatch(serialized, /platform_id/);
  assert.doesNotMatch(serialized, /section_label/);
  assert.doesNotMatch(serialized, /"id":/);
});

function buildRawPolicyChange(
  overrides: Partial<
    PolicyChange & {
      platform_name: string;
      platform_slug: string;
      source_title: string | null;
      source_url: string | null;
      old_snapshot_title: string | null;
      old_snapshot_captured_at: string | null;
      new_snapshot_title: string | null;
      new_snapshot_captured_at: string | null;
    }
  > = {},
) {
  return {
    id: "change-1",
    platform_id: "platform-1",
    source_id: "source-1",
    old_snapshot_id: "snapshot-old",
    new_snapshot_id: "snapshot-new",
    change_type: "timing_change",
    summary: "Payout hold duration language was shortened for a subset of reviews.",
    impact_level: "high",
    published_status: "published",
    what_changed:
      "The official support wording now states a shorter hold window in the reviewed clause set.",
    who_is_affected: ["Business accounts under payout review"],
    why_it_matters:
      "A shorter hold window can reduce working-capital pressure, but operators still need backup payout planning.",
    what_to_do: ["Confirm whether your account type falls under the updated wording."],
    reviewed_at: "2026-07-15T00:00:00.000Z",
    published_at: "2026-07-15T00:00:00.000Z",
    archived_at: null,
    created_at: "2026-07-15T00:00:00.000Z",
    updated_at: "2026-07-15T00:00:00.000Z",
    policy_source_id: "legacy-source-1",
    old_version_id: "legacy-version-old",
    new_version_id: "legacy-version-new",
    old_hash: "old",
    new_hash: "new",
    detected_at: "2026-07-15T00:00:00.000Z",
    status: "reviewed",
    importance: "high",
    reviewed_by: "user-1",
    platform_name: "PayPal",
    platform_slug: "paypal",
    source_title: "Official help article",
    source_url: "javascript:alert(1)",
    old_snapshot_title: "Earlier snapshot",
    old_snapshot_captured_at: "2026-07-10T00:00:00.000Z",
    new_snapshot_title: "Current snapshot",
    new_snapshot_captured_at: "2026-07-15T00:00:00.000Z",
    ...overrides,
  } as PolicyChange & {
    platform_name: string;
    platform_slug: string;
    source_title: string | null;
    source_url: string | null;
    old_snapshot_title: string | null;
    old_snapshot_captured_at: string | null;
    new_snapshot_title: string | null;
    new_snapshot_captured_at: string | null;
  };
}

test("public policy change detail strips snapshot ids and unsafe source URLs", () => {
  const shaped = toPublicPolicyChangeDetail(buildRawPolicyChange());
  const serialized = JSON.stringify(shaped);

  assert.equal(shaped.source_url, null);
  assert.doesNotMatch(serialized, /old_snapshot_id/);
  assert.doesNotMatch(serialized, /new_snapshot_id/);
  assert.doesNotMatch(serialized, /source_id/);
  assert.doesNotMatch(serialized, /policy_source_id/);
  assert.doesNotMatch(serialized, /reviewed_by/);
  assert.doesNotMatch(serialized, /javascript:/);
});
