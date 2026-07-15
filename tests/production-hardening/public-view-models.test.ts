import assert from "node:assert/strict";
import test from "node:test";

import {
  toPublicPageRedFlag,
  toPublicPlatformDnaFlags,
} from "../../src/server/polibrawl/services/public-view-models.shared";
import type { RedFlag } from "../../src/types/polibrawl";

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
