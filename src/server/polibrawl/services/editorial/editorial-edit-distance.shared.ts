/**
 * editorial-edit-distance.shared.ts
 *
 * Sprint 10.5 — Editorial Intelligence Calibration
 *
 * Deterministic edit-distance utilities for measuring how much a human
 * editor modifies an AI-generated draft.
 *
 * Edit distance is an operational metric only.
 * Low edit distance does not imply high quality.
 * High edit distance does not imply low quality.
 *
 * These utilities are used by the revision tracking system to record
 * how significantly each structured field was changed.
 */

// ─── Character-Level Edit Distance ───────────────────────────────────────────

/**
 * Wagner-Fischer algorithm for Levenshtein edit distance.
 * Returns the minimum number of single-character edits
 * (insertions, deletions, substitutions) needed to transform `a` into `b`.
 *
 * NOTE: For very long strings this is O(n*m) — we cap string length to
 * 10,000 characters to avoid performance issues on large fields.
 */
export function levenshteinDistance(a: string, b: string): number {
  const MAX_LENGTH = 10_000;
  const s = a.slice(0, MAX_LENGTH);
  const t = b.slice(0, MAX_LENGTH);

  if (s === t) return 0;
  if (s.length === 0) return t.length;
  if (t.length === 0) return s.length;

  const m = s.length;
  const n = t.length;
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);

  for (let i = 1; i <= m; i++) {
    let prev = i;
    for (let j = 1; j <= n; j++) {
      const curr =
        s[i - 1] === t[j - 1]
          ? dp[j - 1]
          : 1 + Math.min(dp[j - 1], dp[j], prev);
      dp[j - 1] = prev;
      prev = curr;
    }
    dp[n] = prev;
  }

  return dp[n];
}

/**
 * Compute normalized edit distance ratio between two strings.
 * Returns a value in [0.0, 1.0]:
 * - 0.0 means identical
 * - 1.0 means completely different
 */
export function editDistanceRatio(a: string, b: string): number {
  if (a === b) return 0;
  if (!a && !b) return 0;

  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 0;

  const dist = levenshteinDistance(a, b);
  return Math.round((dist / maxLen) * 10_000) / 10_000; // 4 decimal places
}

// ─── Structured Field Comparison ─────────────────────────────────────────────

export type StructuredDraftContent = {
  title?: string;
  summary?: string;
  who_is_affected?: string[];
  why_it_matters?: string;
  survival_actions?: string[];
  checklist_items?: string[];
  backup_options?: Array<{ label: string; tradeoff: string }>;
  evidence_summary?: string;
};

export type FieldEditResult = {
  field: string;
  editRatio: number;
  changed: boolean;
};

export type DraftEditDistanceResult = {
  /** Overall edit ratio across all fields (weighted by character length) */
  overallEditRatio: number;
  /** Per-field edit results */
  fieldResults: FieldEditResult[];
  /** Names of fields that were changed (ratio > 0.05) */
  changedFields: string[];
  /** Count of fields changed */
  changedFieldCount: number;
};

function normalizeToString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object") {
          return Object.values(item as Record<string, unknown>)
            .filter((v) => typeof v === "string")
            .join(" | ");
        }
        return String(item);
      })
      .join("\n");
  }
  return "";
}

const CHANGE_THRESHOLD = 0.05; // 5% edit ratio considered a meaningful change

/**
 * Compare two structured draft content snapshots and return a detailed
 * edit-distance result.
 *
 * @param original The original AI-generated content (or prior revision)
 * @param revised The human-edited or critic-revised content
 */
export function computeDraftEditDistance(
  original: StructuredDraftContent,
  revised: StructuredDraftContent,
): DraftEditDistanceResult {
  const fields = [
    "title",
    "summary",
    "who_is_affected",
    "why_it_matters",
    "survival_actions",
    "checklist_items",
    "backup_options",
    "evidence_summary",
  ] as const;

  const fieldResults: FieldEditResult[] = [];
  let totalWeightedRatio = 0;
  let totalLength = 0;

  for (const field of fields) {
    const origText = normalizeToString(original[field] ?? "");
    const revText = normalizeToString(revised[field] ?? "");

    const ratio = editDistanceRatio(origText, revText);
    const maxLen = Math.max(origText.length, revText.length);
    const changed = ratio > CHANGE_THRESHOLD;

    fieldResults.push({ field, editRatio: ratio, changed });

    totalWeightedRatio += ratio * maxLen;
    totalLength += maxLen;
  }

  const overallEditRatio = totalLength > 0
    ? Math.round((totalWeightedRatio / totalLength) * 10_000) / 10_000
    : 0;

  const changedFields = fieldResults
    .filter((r) => r.changed)
    .map((r) => r.field);

  return {
    overallEditRatio,
    fieldResults,
    changedFields,
    changedFieldCount: changedFields.length,
  };
}

/**
 * Build a revision content snapshot from a structured draft.
 * This is what gets stored in editorial_draft_revisions.content_snapshot.
 *
 * Internal metadata (IDs, timestamps, status) is excluded — only
 * public-facing structured content is snapshotted for comparison.
 */
export function buildRevisionContentSnapshot(content: StructuredDraftContent): Record<string, unknown> {
  return {
    title: content.title ?? "",
    summary: content.summary ?? "",
    who_is_affected: content.who_is_affected ?? [],
    why_it_matters: content.why_it_matters ?? "",
    survival_actions: content.survival_actions ?? [],
    checklist_items: content.checklist_items ?? [],
    backup_options: content.backup_options ?? [],
    evidence_summary: content.evidence_summary ?? "",
  };
}
