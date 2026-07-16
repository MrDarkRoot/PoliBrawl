import { getActionDefinition } from "@/features/payment-decision/rules/action-codes";
import { getRecommendationDefinition } from "@/features/payment-decision/rules/recommendation-codes";
import {
  evaluatePaymentDecision,
  formatLimitation,
} from "@/features/payment-decision/services/evaluate-payment-decision";
import type {
  BackupPlanItem,
  DecisionEvidence,
  MatchedDecisionRisk,
  PaymentConcern,
  PaymentDecisionInput,
  PaymentDecisionProfile,
  PaymentDecisionResult,
  PaymentRiskCategory,
} from "@/features/payment-decision/types/payment-decision.types";

const concernRiskMap: Record<PaymentConcern, PaymentRiskCategory[]> = {
  fund_hold: ["fund_hold", "reserve"],
  account_limitation: ["account_limitation"],
  kyc: ["kyc_verification"],
  withdrawal: ["withdrawal_restriction"],
  chargeback: ["chargeback"],
  support_or_appeal: ["appeal_support"],
  country_eligibility: ["country_eligibility"],
};

function uniqueBy<T>(items: T[], key: (item: T) => string) {
  const seen = new Set<string>();
  const output: T[] = [];

  for (const item of items) {
    const value = key(item);
    if (seen.has(value)) {
      continue;
    }

    seen.add(value);
    output.push(item);
  }

  return output;
}

function toPublicRisk(
  risk: PaymentDecisionProfile["risks"][number],
): MatchedDecisionRisk {
  return {
    category: risk.category,
    title: risk.title,
    relevance: risk.relevance,
    possibleImpact: risk.possibleImpact,
    level: risk.level,
    evidence: risk.evidence.map(toPublicEvidence),
  };
}

function toPublicEvidence(
  evidence: PaymentDecisionProfile["evidence"][number],
): DecisionEvidence {
  return {
    title: evidence.title,
    excerpt: evidence.excerpt,
    sourceTitle: evidence.sourceTitle,
    sourceUrl: evidence.sourceUrl,
    reviewedAt: evidence.reviewedAt,
    publishedAt: evidence.publishedAt,
    riskCategory: evidence.riskCategory,
    confidence: evidence.confidence,
  };
}

function buildRelevantRisks(
  input: PaymentDecisionInput,
  profile: PaymentDecisionProfile,
  requiredCategories: PaymentRiskCategory[],
) {
  const concernCategories = input.concerns.flatMap(
    (concern) => concernRiskMap[concern] ?? [],
  );
  const selected = new Set([...requiredCategories, ...concernCategories]);
  const risks = selected.size > 0
    ? profile.risks.filter((risk) => selected.has(risk.category))
    : profile.risks;

  return uniqueBy(risks.length > 0 ? risks : profile.risks.slice(0, 4), (risk) =>
    `${risk.internalRiskId}:${risk.category}`,
  )
    .slice(0, 6)
    .map(toPublicRisk);
}

function buildBackupPlan(): BackupPlanItem[] {
  return [
    {
      scenario: "account_limitation",
      title: "If the account is limited",
      primaryAction:
        "Pause new payouts to this route and export transaction/support records immediately.",
      backupAction:
        "Ask the payer to reroute the next payout to the verified secondary method.",
      tradeOff:
        "The backup route may be slower or more expensive, but it keeps new funds away from a restricted account.",
    },
    {
      scenario: "withdrawal_delay",
      title: "If withdrawal is delayed",
      primaryAction:
        "Keep the withdrawal request, bank-route evidence, and support timeline outside the platform.",
      backupAction:
        "Use a second payout route for new payments until the delay is resolved.",
      tradeOff:
        "Splitting payments can complicate records, but it reduces exposure to one delayed withdrawal path.",
    },
    {
      scenario: "kyc_request",
      title: "If verification is requested",
      primaryAction:
        "Submit prepared identity, address, business, and payment-source documents through official channels only.",
      backupAction:
        "Move future payments to a route where verification is already complete while the request is reviewed.",
      tradeOff:
        "Early document preparation costs time, but it prevents rushed collection after money is already on the platform.",
    },
    {
      scenario: "unavailable_payout_route",
      title: "If the payout route is unavailable",
      primaryAction:
        "Confirm whether the issue is country, payer, currency, account type, or bank-route related.",
      backupAction:
        "Use a payer-supported alternative and keep the original route as secondary only after a test withdrawal succeeds.",
      tradeOff:
        "An alternative may have worse fees, but it avoids waiting for a route that may not support the situation.",
    },
  ];
}

export function buildPaymentDecisionReport(
  input: PaymentDecisionInput,
  profile: PaymentDecisionProfile,
  options: { generatedAt?: string } = {},
): PaymentDecisionResult {
  const evaluation = evaluatePaymentDecision(input, profile);
  const recommendation = getRecommendationDefinition(evaluation.recommendationCode);
  const requiredCategories = evaluation.matchedRules.flatMap(
    (match) => match.requiredRiskCategories,
  );
  const risks = buildRelevantRisks(input, profile, requiredCategories);
  const evidence = uniqueBy(
    risks.flatMap((risk) => risk.evidence),
    (item) => `${item.sourceUrl}:${item.title}:${item.riskCategory}`,
  ).slice(0, 10);
  const checklist = evaluation.actionCodes.map(getActionDefinition);

  return {
    input,
    platform: {
      slug: profile.platform.slug,
      name: profile.platform.name,
      websiteUrl: profile.platform.websiteUrl,
      readinessState: profile.readinessState,
    },
    recommendationCode: recommendation.code,
    recommendationTitle: recommendation.title,
    recommendationSummary: recommendation.summary,
    reasons: evaluation.matchedRules.map((match) => match.reason).slice(0, 5),
    risks,
    checklist,
    backupPlan: buildBackupPlan(),
    evidence,
    confidence: evaluation.confidence,
    limitations: evaluation.limitationCodes.map(formatLimitation),
    matchedRuleKeys: evaluation.matchedRules.map((match) => match.ruleKey),
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    reviewedDataAt: profile.coverage.latestReviewedAt ?? undefined,
  };
}
