import assert from "node:assert/strict";
import test from "node:test";

import { findMissingPolibrawlTables } from "../../src/server/polibrawl/schema-health.shared";

test("schema health reports missing required tables", () => {
  const missing = findMissingPolibrawlTables(["platforms", "sources", "source_snapshots"]);

  assert.deepEqual(missing, [
    "red_flags",
    "resolution_routes",
    "dependency_scores",
    "risk_timelines",
    "evidence_confidence",
  ]);
});
