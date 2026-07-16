export const requiredPolibrawlTables = [
  "platforms",
  "red_flags",
  "sources",
  "source_snapshots",
  "resolution_routes",
  "dependency_scores",
  "risk_timelines",
  "evidence_confidence",
  "policy_changes",
  "user_platform_watchlist",
  "policy_alerts",
  "editorial_drafts",
  "payment_decision_sessions",
  "payment_decision_results",
] as const;

export function findMissingPolibrawlTables(existingTables: readonly string[]) {
  const existing = new Set(existingTables.map((table) => table.toLowerCase()));
  return requiredPolibrawlTables.filter((table) => !existing.has(table));
}
