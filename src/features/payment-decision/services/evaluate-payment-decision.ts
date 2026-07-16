import { getActionDefinition } from "@/features/payment-decision/rules/action-codes";
import {
  paymentDependencyRules,
  resolveRecommendation,
} from "@/features/payment-decision/rules/payment-dependency.rules";
import type {
  ActionCode,
  ConfidenceLevel,
  DecisionRuleMatch,
  LimitationCode,
  PaymentDecisionEvaluation,
  PaymentDecisionInput,
  PaymentDecisionProfile,
} from "@/features/payment-decision/types/payment-decision.types";

const limitationLabels: Record<LimitationCode, string> = {
  COUNTRY_ELIGIBILITY_UNVERIFIED:
    "Country eligibility or withdrawal support is not verified for this situation.",
  PAYER_COMPATIBILITY_UNVERIFIED:
    "Payer compatibility is not verified for this platform and work type.",
  WITHDRAWAL_PATH_UNVERIFIED:
    "Withdrawal availability is not verified from the stored public evidence.",
  APPEAL_PATH_UNCLEAR:
    "Appeal or support path clarity is low or not documented.",
  PARTIAL_EVIDENCE:
    "The platform profile is not fully decision-ready for this workflow.",
  OLD_EVIDENCE:
    "Some reviewed evidence is old and should be refreshed before high-stakes use.",
  PLATFORM_NOT_REVIEWED:
    "The platform has not been reviewed for payment dependency decisions.",
  VERIFICATION_READINESS_UNKNOWN:
    "The questionnaire does not collect identity-document readiness, so verification readiness is unknown.",
  POLICY_DISCRETION_PRESENT:
    "The matched evidence contains discretionary platform language.",
};

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function latestReviewedDate(profile: PaymentDecisionProfile) {
  const candidates = [
    profile.platform.lastReviewedAt,
    profile.coverage.latestReviewedAt,
    ...profile.evidence.map((item) => item.reviewedAt),
  ].filter(Boolean) as string[];

  return candidates.sort((left, right) => right.localeCompare(left))[0] ?? null;
}

function isRecentlyReviewed(value: string | null) {
  if (!value) {
    return false;
  }

  const reviewedAt = new Date(value).getTime();
  if (Number.isNaN(reviewedAt)) {
    return false;
  }

  const eighteenMonths = 1000 * 60 * 60 * 24 * 548;
  return Date.now() - reviewedAt <= eighteenMonths;
}

function confidenceFromScore(
  score: number,
  profile: PaymentDecisionProfile,
  matches: DecisionRuleMatch[],
): ConfidenceLevel {
  const hasNoReliableDecision = matches.some(
    (match) => match.ruleKey === "no_reliable_decision",
  );

  if (profile.readinessState !== "decision_ready" || hasNoReliableDecision) {
    return score >= 4 ? "moderate" : "low";
  }

  if (score >= 6) {
    return "high";
  }

  if (score >= 3) {
    return "moderate";
  }

  return "low";
}

function buildConfidence(
  profile: PaymentDecisionProfile,
  matches: DecisionRuleMatch[],
) {
  let score = 2;
  const reasons: string[] = [];
  const reviewedAt = latestReviewedDate(profile);

  if (profile.readinessState === "decision_ready") {
    score += 2;
    reasons.push("Platform profile meets the decision-ready evidence gate.");
  } else if (profile.readinessState === "country_verification_required") {
    score -= 2;
    reasons.push("Country-specific evidence still requires verification.");
  } else if (profile.readinessState === "partial_evidence") {
    score -= 1;
    reasons.push("Only partial decision evidence is available.");
  } else {
    score -= 3;
    reasons.push("The platform is not reviewed for this decision workflow.");
  }

  if (profile.coverage.officialSourceCount >= 2) {
    score += 1;
    reasons.push("Multiple reviewed source records are available.");
  } else if (profile.coverage.officialSourceCount === 0) {
    score -= 2;
    reasons.push("No active reviewed official source record is available.");
  }

  if (profile.coverage.approvedEvidenceCount >= 3) {
    score += 1;
    reasons.push("Several approved evidence records match the decision categories.");
  }

  if (isRecentlyReviewed(reviewedAt)) {
    score += 1;
    reasons.push("Relevant evidence was reviewed recently enough for MVP use.");
  } else {
    score -= 1;
    reasons.push("Reviewed-date coverage is missing or old.");
  }

  for (const [label, clarity] of [
    ["Country eligibility", profile.coverage.countryEligibility],
    ["Payer compatibility", profile.coverage.payerCompatibility],
    ["Withdrawal path", profile.coverage.withdrawalPath],
    ["Appeal/support path", profile.coverage.appealClarity],
  ] as const) {
    if (clarity === "documented") {
      score += 1;
      reasons.push(`${label} is documented in the mapped evidence.`);
    } else if (clarity === "limited" || clarity === "low") {
      score -= 1;
      reasons.push(`${label} is only partially documented.`);
    } else {
      score -= 1;
      reasons.push(`${label} is not documented well enough for high confidence.`);
    }
  }

  if (profile.coverage.discretionaryLanguage) {
    score -= 1;
    reasons.push("Matched evidence includes discretionary platform language.");
  }

  score += matches.reduce((total, match) => total + match.confidenceAdjustment, 0);

  return {
    level: confidenceFromScore(score, profile, matches),
    reasons: unique(reasons).slice(0, 8),
  };
}

export function evaluatePaymentDecision(
  input: PaymentDecisionInput,
  profile: PaymentDecisionProfile,
): PaymentDecisionEvaluation {
  const context = { input, profile };
  const matchedRules = paymentDependencyRules
    .map((rule) => rule.evaluate(context))
    .filter((match): match is DecisionRuleMatch => Boolean(match))
    .sort((left, right) => right.priority - left.priority);

  const actionCodes = unique(
    matchedRules.flatMap((match) => match.actionCodes),
  ).filter((code): code is ActionCode => Boolean(getActionDefinition(code)));

  const limitationCodes = unique([
    ...matchedRules.flatMap((match) => match.limitationCodes),
    ...(profile.coverage.oldEvidence ? (["OLD_EVIDENCE"] as LimitationCode[]) : []),
    ...(profile.coverage.discretionaryLanguage
      ? (["POLICY_DISCRETION_PRESENT"] as LimitationCode[])
      : []),
    ...(profile.readinessState === "not_reviewed"
      ? (["PLATFORM_NOT_REVIEWED"] as LimitationCode[])
      : []),
  ]);

  return {
    recommendationCode: resolveRecommendation(matchedRules),
    matchedRules,
    actionCodes,
    limitationCodes,
    confidence: buildConfidence(profile, matchedRules),
  };
}

export function formatLimitation(code: LimitationCode) {
  return limitationLabels[code];
}
