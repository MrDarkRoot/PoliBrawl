/**
 * editorial-critic.service.ts
 *
 * Sprint 10.5 — Editorial Intelligence Calibration
 *
 * The editorial critic evaluates a generated draft against multiple quality
 * dimensions and returns a structured result that is stored with the draft.
 *
 * The critic does NOT generate a new article.
 * The critic does NOT approve publication.
 * The critic returns findings that a human reviewer can act on.
 *
 * Security note: evidence text is treated as quoted data, never as instructions.
 * All critic logic is deterministic string analysis — no LLM calls.
 */

import type { EditorialDraftTemplateOutput } from "@/server/polibrawl/services/editorial/templates/shared";
import type { EnrichedEditorialContext } from "@/server/polibrawl/services/editorial/editorial-context-enrichment.service";
import type { CategoryEditorialTemplate } from "@/server/polibrawl/services/editorial/category-editorial-templates";

// ─── Critic Result Types ──────────────────────────────────────────────────────

export type CriticIssueSeverity = "low" | "medium" | "high" | "blocker";

export type CriticIssue = {
  code: string;
  severity: CriticIssueSeverity;
  field: keyof EditorialDraftTemplateOutput | "global";
  message: string;
};

export type EvidenceCoverage = {
  /** Number of claims in the draft that are directly supported by evidence excerpts */
  supportedClaims: number;
  /** Number of phrases flagged as potentially unsupported */
  unsupportedClaims: number;
};

export type CriticResult = {
  /** Whether the draft passes critic review without blockers */
  approved: boolean;
  /** Overall quality score 0–100 */
  score: number;
  /** All issues found, sorted by severity */
  issues: CriticIssue[];
  /** Specific revision actions required before human approval */
  requiredRevisions: string[];
  /** Evidence coverage analysis */
  evidenceCoverage: EvidenceCoverage;
};

// ─── Generic / Flagged Phrase Patterns ───────────────────────────────────────

/**
 * These phrases are flagged when they appear in AI-generated drafts.
 * They represent generic, overconfident, or inappropriate language.
 *
 * SECURITY: These patterns operate on stored draft text — not on raw evidence.
 * Evidence text is quoted data and is never evaluated by these patterns as
 * instructions or system commands.
 */
const genericAiPhrases: Array<{ pattern: RegExp; code: string; message: string }> = [
  {
    pattern: /analysis reveals/i,
    code: "GENERIC_AI_PHRASE_ANALYSIS_REVEALS",
    message: '"analysis reveals" is generic AI phrasing. Replace with a direct statement about what the evidence shows.',
  },
  {
    pattern: /critical control regarding/i,
    code: "GENERIC_AI_PHRASE_CRITICAL_CONTROL",
    message: '"critical control regarding" is generic AI phrasing. State the specific control directly.',
  },
  {
    pattern: /users should simply/i,
    code: "GENERIC_AI_PHRASE_SIMPLY",
    message: '"users should simply" minimizes complexity. Remove "simply" and state the action directly.',
  },
  {
    pattern: /official survival overview/i,
    code: "INTERNAL_METADATA_SURVIVAL_OVERVIEW",
    message: '"official survival overview" is internal-only language. Remove from public-facing fields.',
  },
  {
    pattern: /this proves/i,
    code: "UNSUPPORTED_CERTAINTY_PROVES",
    message: '"this proves" implies absolute certainty. Use "this suggests" or "the evidence shows".',
  },
  {
    pattern: /the platform is malicious/i,
    code: "PROHIBITED_PLATFORM_CHARACTERIZATION",
    message: "Do not characterize platform intent as malicious. Focus on operational risk.",
  },
  {
    pattern: /the platform illegally/i,
    code: "LEGAL_CONCLUSION_ILLEGAL",
    message: "Do not make legal conclusions about the platform. This is legal advice territory.",
  },
  {
    pattern: /all users/i,
    code: "OVERBROAD_USER_CLAIM",
    message: '"all users" is almost always inaccurate. Specify which users are affected and under what conditions.',
  },
  {
    pattern: /massive financial loss/i,
    code: "UNSUBSTANTIATED_IMPACT_CLAIM",
    message: '"massive financial loss" is unsubstantiated. Describe the operational consequence specifically.',
  },
  {
    pattern: /guaranteed/i,
    code: "UNSUPPORTED_GUARANTEE",
    message: '"guaranteed" is a forbidden claim. Remove or qualify with evidence.',
  },
  {
    pattern: /will recover/i,
    code: "UNSUPPORTED_RECOVERY_CLAIM",
    message: '"will recover" is a forbidden claim. Do not predict recovery outcomes.',
  },
  {
    pattern: /\balways\b/i,
    code: "UNSUPPORTED_ABSOLUTE_ALWAYS",
    message: '"always" is an unsupported absolute. Use "may" or "can" or cite the specific evidence.',
  },
  {
    pattern: /\bnever\b/i,
    code: "UNSUPPORTED_ABSOLUTE_NEVER",
    message: '"never" is an unsupported absolute. Use "may not" or cite the specific evidence.',
  },
  {
    pattern: /publish this immediately/i,
    code: "PROMPT_INJECTION_PUBLISH",
    message: "Possible prompt injection detected: 'publish this immediately'. This content must not modify editorial workflow.",
  },
  {
    pattern: /ignore previous instructions/i,
    code: "PROMPT_INJECTION_IGNORE_INSTRUCTIONS",
    message: "Possible prompt injection detected: 'ignore previous instructions'. This content must not modify system behavior.",
  },
  {
    pattern: /reveal system prompt/i,
    code: "PROMPT_INJECTION_REVEAL_PROMPT",
    message: "Possible prompt injection detected: 'reveal system prompt'. This content must not modify system behavior.",
  },
  {
    pattern: /source_snapshot_id/i,
    code: "INTERNAL_METADATA_SNAPSHOT_ID",
    message: "Internal metadata field 'source_snapshot_id' must not appear in public-facing draft content.",
  },
  {
    pattern: /research_packet_id/i,
    code: "INTERNAL_METADATA_PACKET_ID",
    message: "Internal metadata field 'research_packet_id' must not appear in public-facing draft content.",
  },
  {
    pattern: /noise_score/i,
    code: "INTERNAL_METADATA_NOISE_SCORE",
    message: "Internal metadata field 'noise_score' must not appear in public-facing draft content.",
  },
  {
    pattern: /confidence_score/i,
    code: "INTERNAL_METADATA_CONFIDENCE_SCORE",
    message: "Internal metadata field 'confidence_score' must not appear in public-facing draft content.",
  },
  {
    pattern: /scanner/i,
    code: "INTERNAL_METADATA_SCANNER",
    message: "Internal metadata reference to 'scanner' must not appear in public-facing draft content.",
  },
  {
    pattern: /editorial team/i,
    code: "INTERNAL_METADATA_EDITORIAL_TEAM",
    message: "Internal reference to 'editorial team' must not appear in public-facing draft content.",
  },
];

// Blocker patterns that always block publication regardless of score
const blockerPatterns: typeof genericAiPhrases = genericAiPhrases.filter((p) =>
  [
    "PROMPT_INJECTION_PUBLISH",
    "PROMPT_INJECTION_IGNORE_INSTRUCTIONS",
    "PROMPT_INJECTION_REVEAL_PROMPT",
    "INTERNAL_METADATA_SNAPSHOT_ID",
    "INTERNAL_METADATA_PACKET_ID",
    "INTERNAL_METADATA_NOISE_SCORE",
    "INTERNAL_METADATA_CONFIDENCE_SCORE",
    "INTERNAL_METADATA_SCANNER",
    "INTERNAL_METADATA_EDITORIAL_TEAM",
    "LEGAL_CONCLUSION_ILLEGAL",
    "PROHIBITED_PLATFORM_CHARACTERIZATION",
  ].includes(p.code),
);

// ─── Quality Score Model ──────────────────────────────────────────────────────

export type QualityScoreComponents = {
  /** 0–25: How directly evidence excerpts support draft claims */
  evidence_grounding: number;
  /** 0–15: How specific the draft is to the named platform */
  platform_specificity: number;
  /** 0–10: How clearly the draft identifies affected users and their preconditions */
  affected_user_clarity: number;
  /** 0–15: How specifically the operational consequence is described */
  operational_impact: number;
  /** 0–15: How actionable and specific the actions and checklist are */
  actionability: number;
  /** 0–10: Quality of backup options and realism of trade-offs */
  backup_quality: number;
  /** 0–10: How well the draft handles uncertainty without overclaiming */
  uncertainty_handling: number;
};

export type QualityEvaluation = {
  totalScore: number;
  components: QualityScoreComponents;
  /** Deductions applied with reasons */
  deductions: Array<{ reason: string; points: number }>;
  /** Human-readable summary of the quality evaluation */
  summary: string;
};

// ─── Internal Scoring Helpers ─────────────────────────────────────────────────

function collectAllText(draft: EditorialDraftTemplateOutput): string {
  return [
    draft.title,
    draft.summary,
    ...draft.who_is_affected,
    draft.why_it_matters,
    ...draft.survival_actions,
    ...draft.checklist_items,
    draft.evidence_summary,
    ...draft.backup_options.flatMap((o) => [o.label, o.tradeoff]),
  ].join("\n");
}

function containsAny(text: string, fragments: string[]): boolean {
  const lower = text.toLowerCase();
  return fragments.some((f) => lower.includes(f.toLowerCase()));
}

function scoreEvidenceGrounding(
  draft: EditorialDraftTemplateOutput,
  context: EnrichedEditorialContext,
): { score: number; deductions: Array<{ reason: string; points: number }> } {
  const deductions: Array<{ reason: string; points: number }> = [];
  let score = 25;

  if (context.evidence.totalEvidenceItems === 0) {
    deductions.push({ reason: "No official evidence items present in research packet", points: 25 });
    return { score: 0, deductions };
  }

  if (context.evidence.evidenceStrength === "weak") {
    deductions.push({ reason: "Evidence strength classified as weak (low confidence or high noise)", points: 10 });
    score -= 10;
  } else if (context.evidence.evidenceStrength === "moderate") {
    deductions.push({ reason: "Evidence strength is moderate — not all claims may be fully grounded", points: 5 });
    score -= 5;
  }

  // Check if draft mentions evidence — it should contain some reference to the evidence content
  const excerptText = context.evidence.strongestExcerpts.map((e) => e.excerpt).join(" ");
  const excerptWords = excerptText.toLowerCase().split(/\s+/).filter((w) => w.length > 5);
  const draftText = collectAllText(draft).toLowerCase();
  const matchedWords = excerptWords.filter((w) => draftText.includes(w));
  const matchRatio = excerptWords.length > 0 ? matchedWords.length / excerptWords.length : 0;

  if (matchRatio < 0.1) {
    deductions.push({ reason: "Draft appears not to incorporate specific evidence language", points: 8 });
    score -= 8;
  }

  return { score: Math.max(0, score), deductions };
}

function scorePlatformSpecificity(
  draft: EditorialDraftTemplateOutput,
  context: EnrichedEditorialContext,
): { score: number; deductions: Array<{ reason: string; points: number }> } {
  const deductions: Array<{ reason: string; points: number }> = [];
  let score = 15;

  const platformName = context.platform.platformName.toLowerCase();
  const allText = collectAllText(draft).toLowerCase();

  if (!allText.includes(platformName) && platformName !== "this platform") {
    deductions.push({ reason: `Draft does not mention platform name "${context.platform.platformName}"`, points: 8 });
    score -= 8;
  }

  // Check for known-generic phrases that could apply to any platform
  const genericPhrases = [
    "the platform",
    "this platform",
    "any payment processor",
    "online payment platform",
  ];
  let genericCount = 0;
  for (const phrase of genericPhrases) {
    const count = (allText.match(new RegExp(phrase, "g")) ?? []).length;
    genericCount += count;
  }
  if (genericCount > 5) {
    deductions.push({ reason: "High density of generic platform references — draft is not platform-specific enough", points: 5 });
    score -= 5;
  }

  return { score: Math.max(0, score), deductions };
}

function scoreAffectedUserClarity(
  draft: EditorialDraftTemplateOutput,
  context: EnrichedEditorialContext,
): { score: number; deductions: Array<{ reason: string; points: number }> } {
  const deductions: Array<{ reason: string; points: number }> = [];
  let score = 10;

  if (draft.who_is_affected.length === 0) {
    deductions.push({ reason: "No affected user groups identified", points: 10 });
    return { score: 0, deductions };
  }

  // Check for overly broad claims
  const combinedText = draft.who_is_affected.join(" ").toLowerCase();
  if (combinedText.includes("all users") || combinedText.includes("everyone")) {
    deductions.push({ reason: '"all users" or "everyone" is too broad — specify which users and under what conditions', points: 5 });
    score -= 5;
  }

  // Check for precondition specificity
  const hasPrecondition =
    combinedText.includes("who") ||
    combinedText.includes("depend") ||
    combinedText.includes("relying") ||
    combinedText.includes("whose");
  if (!hasPrecondition && draft.who_is_affected.length <= 1) {
    deductions.push({ reason: "Affected user groups lack specificity — no preconditions or dependency described", points: 3 });
    score -= 3;
  }

  return { score: Math.max(0, score), deductions };
}

function scoreOperationalImpact(
  draft: EditorialDraftTemplateOutput,
  _context: EnrichedEditorialContext,
): { score: number; deductions: Array<{ reason: string; points: number }> } {
  const deductions: Array<{ reason: string; points: number }> = [];
  let score = 15;

  const allText = collectAllText(draft).toLowerCase();

  // Check for operational-consequence language
  const operationalTerms = [
    "cash flow", "payroll", "supplier", "settlement", "operating", "revenue",
    "income", "workflow", "continuity", "business", "payment",
  ];
  const hasOperationalLanguage = operationalTerms.some((term) => allText.includes(term));

  if (!hasOperationalLanguage) {
    deductions.push({ reason: "Draft does not describe specific operational consequences", points: 8 });
    score -= 8;
  }

  const vaguePhrases = ["may affect operations", "could impact business", "operational issues"];
  if (containsAny(allText, vaguePhrases)) {
    deductions.push({ reason: "Operational impact is described in vague terms — specify which operations and how", points: 5 });
    score -= 5;
  }

  return { score: Math.max(0, score), deductions };
}

function scoreActionability(
  draft: EditorialDraftTemplateOutput,
  _context: EnrichedEditorialContext,
): { score: number; deductions: Array<{ reason: string; points: number }> } {
  const deductions: Array<{ reason: string; points: number }> = [];
  let score = 15;

  const actions = [...draft.survival_actions, ...draft.checklist_items];

  if (actions.length === 0) {
    deductions.push({ reason: "No actions or checklist items present", points: 15 });
    return { score: 0, deductions };
  }

  // Check for vague action items
  const vagueActionPhrases = [
    "consider your options",
    "think about",
    "be aware",
    "stay informed",
    "keep in mind",
    "make sure to",
    "ensure your operations comply",
  ];
  const vagueItems = actions.filter((action) =>
    containsAny(action.toLowerCase(), vagueActionPhrases),
  );
  if (vagueItems.length > 0) {
    deductions.push({ reason: `${vagueItems.length} vague action item(s) detected — actions must be specific and executable`, points: Math.min(8, vagueItems.length * 3) });
    score -= Math.min(8, vagueItems.length * 3);
  }

  // Check for actionable verbs
  const actionVerbs = ["export", "document", "test", "map", "identify", "prepare", "keep", "review", "save", "confirm", "assign", "notify"];
  const hasActionVerbs = actions.some((action) =>
    actionVerbs.some((verb) => action.toLowerCase().startsWith(verb) || action.toLowerCase().includes(` ${verb} `)),
  );
  if (!hasActionVerbs) {
    deductions.push({ reason: "Actions lack imperative verbs (export, document, test, map, etc.)", points: 5 });
    score -= 5;
  }

  return { score: Math.max(0, score), deductions };
}

function scoreBackupQuality(
  draft: EditorialDraftTemplateOutput,
  _context: EnrichedEditorialContext,
): { score: number; deductions: Array<{ reason: string; points: number }> } {
  const deductions: Array<{ reason: string; points: number }> = [];
  let score = 10;

  if (draft.backup_options.length === 0) {
    deductions.push({ reason: "No backup options present", points: 10 });
    return { score: 0, deductions };
  }

  const missingTradeoffs = draft.backup_options.filter(
    (option) =>
      !option.tradeoff ||
      option.tradeoff.trim().length < 20 ||
      !containsAny(option.tradeoff.toLowerCase(), ["but", "however", "adds", "requires", "slower", "overhead", "cost", "compliance", "trade", "limit"]),
  );

  if (missingTradeoffs.length > 0) {
    deductions.push({ reason: `${missingTradeoffs.length} backup option(s) lack meaningful trade-off disclosure`, points: Math.min(8, missingTradeoffs.length * 4) });
    score -= Math.min(8, missingTradeoffs.length * 4);
  }

  return { score: Math.max(0, score), deductions };
}

function scoreUncertaintyHandling(
  draft: EditorialDraftTemplateOutput,
  template: CategoryEditorialTemplate,
): { score: number; deductions: Array<{ reason: string; points: number }> } {
  const deductions: Array<{ reason: string; points: number }> = [];
  let score = 10;

  const allText = collectAllText(draft).toLowerCase();

  // Check for forbidden claims from the category template
  const matchedForbidden = template.forbiddenClaims.filter((claim) =>
    allText.includes(claim.toLowerCase()),
  );

  if (matchedForbidden.length > 0) {
    const points = Math.min(10, matchedForbidden.length * 5);
    deductions.push({ reason: `Category-forbidden claims detected: ${matchedForbidden.slice(0, 3).join(", ")}`, points });
    score -= points;
  }

  // Check for legal advice language
  const legalAdvicePhrases = ["legal advice", "consult a lawyer", "seek legal", "you are legally entitled"];
  if (containsAny(allText, legalAdvicePhrases)) {
    deductions.push({ reason: "Draft contains legal advice language — not permitted", points: 10 });
    return { score: 0, deductions };
  }

  return { score: Math.max(0, score), deductions };
}

// ─── Critic Main Function ─────────────────────────────────────────────────────

/**
 * Run the editorial critic against a generated draft.
 *
 * @param draft The structured draft output from the AI provider
 * @param context The enriched editorial context
 * @param categoryTemplate The selected category template
 * @returns CriticResult with score, issues, and revision requirements
 *
 * SECURITY: All pattern matching operates on stored draft text only.
 * Evidence excerpts in context.evidence.strongestExcerpts are used for
 * scoring calculations only, never as executable content.
 */
export function runEditorialCritic(
  draft: EditorialDraftTemplateOutput,
  context: EnrichedEditorialContext,
  categoryTemplate: CategoryEditorialTemplate,
): CriticResult {
  const issues: CriticIssue[] = [];
  const requiredRevisions: string[] = [];
  const allDeductions: Array<{ reason: string; points: number }> = [];

  const allText = collectAllText(draft);

  // ── 1. Generic AI phrase detection (applied across all text fields) ──
  for (const fieldName of Object.keys(draft) as (keyof EditorialDraftTemplateOutput)[]) {
    const fieldValue = draft[fieldName];
    if (typeof fieldValue !== "string" && !Array.isArray(fieldValue)) continue;

    const fieldText = Array.isArray(fieldValue)
      ? (fieldValue as string[]).join(" ")
      : (fieldValue as string);

    for (const { pattern, code, message } of genericAiPhrases) {
      if (pattern.test(fieldText)) {
        const isBlocker = blockerPatterns.some((b) => b.code === code);
        const severity: CriticIssueSeverity =
          code.startsWith("PROMPT_INJECTION") || code.startsWith("INTERNAL_METADATA") || isBlocker
            ? "blocker"
            : code.startsWith("UNSUPPORTED")
            ? "high"
            : "medium";

        issues.push({ code, severity, field: fieldName, message });

        if (severity === "blocker" || severity === "high") {
          requiredRevisions.push(`[${fieldName}] ${message}`);
        }
      }
    }
  }

  // ── 2. Platform specificity check ──
  const platformName = context.platform.platformName.toLowerCase();
  if (
    platformName !== "this platform" &&
    !allText.toLowerCase().includes(platformName)
  ) {
    issues.push({
      code: "GENERIC_PLATFORM_LANGUAGE",
      severity: "medium",
      field: "summary",
      message: `The draft does not mention "${context.platform.platformName}" by name. The content could apply to any payment processor.`,
    });
    requiredRevisions.push(`Tie the consequence specifically to ${context.platform.platformName} and its known operational role.`);
  }

  // ── 3. Evidence grounding — at least one excerpt word present ──
  const excerptWords = context.evidence.strongestExcerpts
    .flatMap((e) => e.excerpt.toLowerCase().split(/\s+/).filter((w) => w.length > 6))
    .slice(0, 20);
  const hasEvidenceLanguage =
    excerptWords.length === 0 ||
    excerptWords.some((w) => allText.toLowerCase().includes(w));

  if (!hasEvidenceLanguage) {
    issues.push({
      code: "WEAK_EVIDENCE_GROUNDING",
      severity: "high",
      field: "evidence_summary",
      message: "The draft does not appear to draw from the specific evidence excerpts in the research packet.",
    });
    requiredRevisions.push("Incorporate specific language from the official evidence excerpts in the evidence_summary and summary fields.");
  }

  // ── 4. Missing affected-user specificity ──
  const whoText = draft.who_is_affected.join(" ").toLowerCase();
  if (whoText.includes("all users") || whoText.includes("everyone who uses")) {
    issues.push({
      code: "OVERBROAD_WHO_IS_AFFECTED",
      severity: "medium",
      field: "who_is_affected",
      message: "Who is affected uses overly broad language. Not all users are equally affected — specify preconditions.",
    });
    requiredRevisions.push("Refine who_is_affected to specify the preconditions: which users, under what dependency, at what scale.");
  }

  // ── 5. Evidence coverage estimation ──
  const evidenceText = context.evidence.strongestExcerpts.map((e) => e.excerpt).join(" ");
  const evidenceWords = new Set(
    evidenceText.toLowerCase().split(/\s+/).filter((w) => w.length > 6),
  );
  const draftWords = allText.toLowerCase().split(/\s+/).filter((w) => w.length > 6);
  const supportedWordCount = draftWords.filter((w) => evidenceWords.has(w)).length;
  const draftWordCount = draftWords.length || 1;
  const supportRatio = supportedWordCount / draftWordCount;

  const evidenceCoverage: EvidenceCoverage = {
    supportedClaims: Math.round(supportRatio * 10),
    unsupportedClaims: Math.round((1 - Math.min(supportRatio, 1)) * 10),
  };

  // ── 6. Minimum evidence check ──
  if (context.evidence.totalEvidenceItems < categoryTemplate.minimumEvidenceItems) {
    issues.push({
      code: "INSUFFICIENT_EVIDENCE",
      severity: "blocker",
      field: "global",
      message: `This category requires at least ${categoryTemplate.minimumEvidenceItems} evidence item(s). Research packet has ${context.evidence.totalEvidenceItems}.`,
    });
    requiredRevisions.push("Attach at least one official evidence excerpt to the research packet before generating a draft.");
  }

  // ── 7. Build quality score ──
  const evidenceResult = scoreEvidenceGrounding(draft, context);
  const platformResult = scorePlatformSpecificity(draft, context);
  const userResult = scoreAffectedUserClarity(draft, context);
  const operationalResult = scoreOperationalImpact(draft, context);
  const actionResult = scoreActionability(draft, context);
  const backupResult = scoreBackupQuality(draft, context);
  const uncertaintyResult = scoreUncertaintyHandling(draft, categoryTemplate);

  const components: QualityScoreComponents = {
    evidence_grounding: evidenceResult.score,
    platform_specificity: platformResult.score,
    affected_user_clarity: userResult.score,
    operational_impact: operationalResult.score,
    actionability: actionResult.score,
    backup_quality: backupResult.score,
    uncertainty_handling: uncertaintyResult.score,
  };

  for (const result of [evidenceResult, platformResult, userResult, operationalResult, actionResult, backupResult, uncertaintyResult]) {
    allDeductions.push(...result.deductions);
  }

  const totalScore = Object.values(components).reduce((a, b) => a + b, 0);

  const qualityEvaluation: QualityEvaluation = {
    totalScore,
    components,
    deductions: allDeductions,
    summary: buildQualitySummary(totalScore, components, issues),
  };

  // ── 8. Determine if approved ──
  const hasBlocker = issues.some((i) => i.severity === "blocker");
  const approved = !hasBlocker && issues.filter((i) => i.severity === "high").length === 0;

  return {
    approved,
    score: totalScore,
    issues: sortIssuesBySeverity(issues),
    requiredRevisions: [...new Set(requiredRevisions)],
    evidenceCoverage,
    // qualityEvaluation is returned separately by the calibrated workflow
    // to avoid circular embedding; we expose it here for callers that need it
    ...(qualityEvaluation as unknown as object),
  } as CriticResult & { qualityEvaluation: QualityEvaluation };
}

export type CriticResultWithQuality = CriticResult & {
  qualityEvaluation: QualityEvaluation;
};

function sortIssuesBySeverity(issues: CriticIssue[]): CriticIssue[] {
  const order: Record<CriticIssueSeverity, number> = {
    blocker: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  return [...issues].sort((a, b) => order[a.severity] - order[b.severity]);
}

function buildQualitySummary(
  totalScore: number,
  components: QualityScoreComponents,
  issues: CriticIssue[],
): string {
  const parts: string[] = [];

  if (totalScore >= 80) {
    parts.push("High quality draft.");
  } else if (totalScore >= 60) {
    parts.push("Acceptable draft with room for improvement.");
  } else if (totalScore >= 40) {
    parts.push("Below-average draft. Human revision strongly recommended.");
  } else {
    parts.push("Low quality draft. Significant revision required before approval.");
  }

  const weakest = Object.entries(components)
    .sort(([, a], [, b]) => a - b)
    .slice(0, 2)
    .map(([key]) => key.replace(/_/g, " "));

  if (weakest.length > 0) {
    parts.push(`Weakest dimensions: ${weakest.join(", ")}.`);
  }

  const blockerCount = issues.filter((i) => i.severity === "blocker").length;
  if (blockerCount > 0) {
    parts.push(`${blockerCount} blocker(s) must be resolved before human approval.`);
  }

  return parts.join(" ");
}
