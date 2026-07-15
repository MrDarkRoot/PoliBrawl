export const requiredPolibrawlTables = [
  "platforms",
  "red_flags",
  "sources",
  "source_snapshots",
  "resolution_routes",
  "dependency_scores",
  "risk_timelines",
  "evidence_confidence",
] as const;

export function findMissingPolibrawlTables(existingTables: readonly string[]) {
  const existing = new Set(existingTables.map((table) => table.toLowerCase()));
  return requiredPolibrawlTables.filter((table) => !existing.has(table));
}
