import { buildPaymentDecisionReport } from "@/features/payment-decision/services/build-payment-decision-report";
import type {
  ConfidenceLevel,
  EvidenceClarity,
  PaymentComparisonInput,
  PaymentDecisionProfile,
  PaymentPlatformComparison,
  PaymentRiskCategory,
} from "@/features/payment-decision/types/payment-decision.types";

const confidenceRank: Record<ConfidenceLevel, number> = {
  low: 1,
  moderate: 2,
  high: 3,
};

function riskCoverage(
  profile: PaymentDecisionProfile,
  categories: PaymentRiskCategory[],
): EvidenceClarity {
  return profile.risks.some((risk) => categories.includes(risk.category))
    ? "documented"
    : "unknown";
}

function backupSuitability(
  profile: PaymentDecisionProfile,
  confidence: ConfidenceLevel,
) {
  if (profile.readinessState === "not_reviewed") {
    return "Not suitable until the platform is reviewed.";
  }

  if (
    profile.coverage.countryEligibility === "missing" ||
    profile.coverage.countryEligibility === "unknown"
  ) {
    return "Not suitable until country support is verified.";
  }

  if (confidence === "high" || confidence === "moderate") {
    return "Potential backup route after a small withdrawal test.";
  }

  return "Backup use still requires verification of payer and withdrawal support.";
}

function profileSummary(
  profile: PaymentDecisionProfile,
  confidence: ConfidenceLevel,
) {
  return {
    slug: profile.platform.slug,
    name: profile.platform.name,
    readinessState: profile.readinessState,
    confidence,
    countryEvidenceCoverage: profile.coverage.countryEligibility,
    fundAccessRisk: riskCoverage(profile, ["fund_hold", "reserve", "account_limitation"]),
    withdrawalRestrictionEvidence: profile.coverage.withdrawalPath,
    verificationRequirements: riskCoverage(profile, ["kyc_verification"]),
    payerCompatibilityLimits: profile.coverage.payerCompatibility,
    appealClarity: profile.coverage.appealClarity,
    backupSuitability: backupSuitability(profile, confidence),
    reviewedDataAt: profile.coverage.latestReviewedAt,
  };
}

function betterPrimaryFit(
  left: ReturnType<typeof profileSummary>,
  right: ReturnType<typeof profileSummary>,
) {
  const leftReady = left.readinessState === "decision_ready";
  const rightReady = right.readinessState === "decision_ready";

  if (!leftReady && !rightReady) {
    return "Neither platform is decision-ready for primary use from the stored evidence.";
  }

  if (leftReady && !rightReady) {
    return `${left.name} has the stronger primary-use evidence gate, but only where country, payer, and withdrawal support are confirmed.`;
  }

  if (!leftReady && rightReady) {
    return `${right.name} has the stronger primary-use evidence gate, but only where country, payer, and withdrawal support are confirmed.`;
  }

  if (confidenceRank[left.confidence] > confidenceRank[right.confidence]) {
    return `${left.name} is the better-supported primary candidate for this situation, not a universally safer platform.`;
  }

  if (confidenceRank[right.confidence] > confidenceRank[left.confidence]) {
    return `${right.name} is the better-supported primary candidate for this situation, not a universally safer platform.`;
  }

  return "Both platforms need a situation-specific primary-use decision; the evidence does not support a universal winner.";
}

function betterBackupFit(
  left: ReturnType<typeof profileSummary>,
  right: ReturnType<typeof profileSummary>,
) {
  const leftBlocked = left.backupSuitability.startsWith("Not suitable");
  const rightBlocked = right.backupSuitability.startsWith("Not suitable");

  if (leftBlocked && rightBlocked) {
    return "Neither platform should be treated as a backup until the blocking evidence gaps are resolved.";
  }

  if (!leftBlocked && rightBlocked) {
    return `${left.name} is the more plausible backup candidate after a small withdrawal test.`;
  }

  if (leftBlocked && !rightBlocked) {
    return `${right.name} is the more plausible backup candidate after a small withdrawal test.`;
  }

  return "Either platform may serve as a backup only after payer support and withdrawal testing are complete.";
}

function unresolvedTradeoffs(
  left: ReturnType<typeof profileSummary>,
  right: ReturnType<typeof profileSummary>,
) {
  const tradeoffs: string[] = [];

  if (left.countryEvidenceCoverage !== "documented" || right.countryEvidenceCoverage !== "documented") {
    tradeoffs.push("Country eligibility remains unresolved for at least one platform.");
  }

  if (left.payerCompatibilityLimits !== "documented" || right.payerCompatibilityLimits !== "documented") {
    tradeoffs.push("Payer compatibility is not fully verified for at least one route.");
  }

  if (left.withdrawalRestrictionEvidence !== "documented" || right.withdrawalRestrictionEvidence !== "documented") {
    tradeoffs.push("Withdrawal availability or restriction evidence is incomplete for at least one platform.");
  }

  if (left.appealClarity !== "documented" || right.appealClarity !== "documented") {
    tradeoffs.push("Appeal or support path clarity differs and should be reviewed before primary use.");
  }

  return tradeoffs.length > 0
    ? tradeoffs
    : ["The main trade-off is operational: primary use still needs a tested secondary route."];
}

export async function comparePaymentPlatforms(
  input: PaymentComparisonInput,
): Promise<PaymentPlatformComparison> {
  const { loadPaymentRiskEvidence } = await import(
    "@/features/payment-decision/services/load-payment-risk-evidence"
  );
  const leftInput = {
    ...input,
    platformSlug: input.platformSlug,
  };
  const rightInput = {
    ...input,
    platformSlug: input.comparisonPlatformSlug,
  };
  const [leftProfile, rightProfile] = await Promise.all([
    loadPaymentRiskEvidence(leftInput.platformSlug, input.country),
    loadPaymentRiskEvidence(rightInput.platformSlug, input.country),
  ]);
  return buildPaymentPlatformComparison(input, leftProfile, rightProfile);
}

export function buildPaymentPlatformComparison(
  input: PaymentComparisonInput,
  leftProfile: PaymentDecisionProfile,
  rightProfile: PaymentDecisionProfile,
  options: { generatedAt?: string } = {},
): PaymentPlatformComparison {
  const leftInput = {
    ...input,
    platformSlug: input.platformSlug,
  };
  const rightInput = {
    ...input,
    platformSlug: input.comparisonPlatformSlug,
  };
  const [leftReport, rightReport] = [
    buildPaymentDecisionReport(leftInput, leftProfile),
    buildPaymentDecisionReport(rightInput, rightProfile),
  ];
  const summaries = [
    profileSummary(leftProfile, leftReport.confidence.level),
    profileSummary(rightProfile, rightReport.confidence.level),
  ];

  return {
    input,
    platforms: summaries,
    betterFitForPrimaryUse: betterPrimaryFit(summaries[0], summaries[1]),
    betterFitForBackupUse: betterBackupFit(summaries[0], summaries[1]),
    unresolvedTradeoffs: unresolvedTradeoffs(summaries[0], summaries[1]),
    generatedAt: options.generatedAt ?? new Date().toISOString(),
  };
}
