import { lowValueDocumentTypes } from "@/lib/constants";

type DiagnosticLevel = "warning" | "info";

export type PipelineDiagnostic = {
  code: string;
  level: DiagnosticLevel;
  message: string;
};

export function buildPipelineDiagnostics(input: {
  rawCandidateCount?: number | null;
  filteredCounts?: Partial<Record<"keep" | "maybe" | "drop", number>> | null;
  extractionConfidence?: number | null;
  plainTextLength?: number | null;
  sections?: Array<{ heading?: string | null; section_text?: string | null }> | null;
  clauses?: Array<{ clause_text?: string | null; word_count?: number | null }> | null;
  signalCandidates?: Array<{
    confidence?: number | null;
    matched_terms?: unknown;
  }> | null;
  source?: {
    document_type?: string | null;
    source_tier?: string | null;
    content_document_type?: string | null;
    content_source_tier?: string | null;
  } | null;
}) {
  const diagnostics: PipelineDiagnostic[] = [];
  const sections = input.sections ?? [];
  const clauses = input.clauses ?? [];
  const signalCandidates = input.signalCandidates ?? [];

  if ((input.rawCandidateCount ?? 0) > 200) {
    diagnostics.push({
      code: "discovery.too_many_candidates",
      level: "warning",
      message: `Discovery produced ${input.rawCandidateCount} raw candidates.`,
    });
  }

  if ((input.filteredCounts?.drop ?? 0) > (input.filteredCounts?.keep ?? 0) * 4) {
    diagnostics.push({
      code: "discovery.high_drop_volume",
      level: "info",
      message: "The filter engine dropped substantially more candidates than it kept.",
    });
  }

  if ((input.plainTextLength ?? 0) < 1500) {
    diagnostics.push({
      code: "extraction.text_too_short",
      level: "warning",
      message: `Extracted plain text is short (${input.plainTextLength ?? 0} chars).`,
    });
  }

  if ((input.extractionConfidence ?? 0) < 0.7) {
    diagnostics.push({
      code: "extraction.low_confidence",
      level: "warning",
      message: `Extraction confidence is low (${input.extractionConfidence ?? 0}).`,
    });
  }

  if (sections.length < 3) {
    diagnostics.push({
      code: "sections.too_few",
      level: "warning",
      message: `Only ${sections.length} sections were generated.`,
    });
  }

  const tinyClauseCount = clauses.filter((clause) => (clause.word_count ?? 0) <= 4).length;
  if (clauses.length && tinyClauseCount / clauses.length >= 0.25) {
    diagnostics.push({
      code: "clauses.too_many_tiny",
      level: "warning",
      message: `${tinyClauseCount} of ${clauses.length} clauses are tiny.`,
    });
  }

  if (!signalCandidates.length) {
    diagnostics.push({
      code: "signals.none_found",
      level: "warning",
      message: "No signal candidates were generated for this version.",
    });
  }

  const weakSignalCount = signalCandidates.filter((candidate) => {
    const matchedTerms = Array.isArray(candidate.matched_terms)
      ? candidate.matched_terms.filter(Boolean)
      : [];
    return (candidate.confidence ?? 0) < 0.55 || matchedTerms.length <= 1;
  }).length;

  if (weakSignalCount > 0) {
    diagnostics.push({
      code: "signals.weak_matches",
      level: "info",
      message: `${weakSignalCount} signal candidates are based on weak or ambiguous matches.`,
    });
  }

  if (
    input.source?.source_tier === "tier_1_core" &&
    input.source.content_source_tier === "tier_4_ignore"
  ) {
    diagnostics.push({
      code: "classification.core_conflict",
      level: "warning",
      message: "Source is marked tier_1_core but content classification suggests low-value.",
    });
  }

  if (
    input.source?.content_document_type &&
    lowValueDocumentTypes.includes(
      input.source.content_document_type as (typeof lowValueDocumentTypes)[number],
    )
  ) {
    diagnostics.push({
      code: "classification.low_value_content",
      level: "warning",
      message: `Content classification suggests low-value content (${input.source.content_document_type}).`,
    });
  }

  return diagnostics;
}
