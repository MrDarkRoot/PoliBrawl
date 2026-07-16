import assert from "node:assert/strict";
import test from "node:test";

import {
  basePaymentDecisionInput,
  comparisonScenario,
  createPaymentDecisionFixtureProfile,
  paymentDecisionScenarios,
} from "../../src/features/payment-decision/fixtures/payment-decision-scenarios";
import {
  paymentCorrectionFormSchema,
  paymentDecisionInputSchema,
} from "../../src/features/payment-decision/schemas/payment-decision-input.schema";
import { buildPaymentDecisionReport } from "../../src/features/payment-decision/services/build-payment-decision-report";
import { buildPaymentPlatformComparison } from "../../src/features/payment-decision/services/compare-payment-platforms";
import {
  createReportToken,
  isValidReportToken,
} from "../../src/features/payment-decision/services/payment-decision-token";
import type {
  PaymentDecisionInput,
  PaymentDecisionProfile,
  PaymentRiskCategory,
} from "../../src/features/payment-decision/types/payment-decision.types";

const generatedAt = "2026-07-16T00:00:00.000Z";

function withoutRisks(
  profile: PaymentDecisionProfile,
  categories: PaymentRiskCategory[],
  coverage: Partial<PaymentDecisionProfile["coverage"]> = {},
) {
  const risks = profile.risks.filter((risk) => !categories.includes(risk.category));
  return {
    ...profile,
    risks,
    evidence: risks.flatMap((risk) => risk.evidence),
    coverage: {
      ...profile.coverage,
      approvedEvidenceCount: risks.flatMap((risk) => risk.evidence).length,
      ...coverage,
    },
  };
}

function report(
  input: Partial<PaymentDecisionInput> = {},
  profile: PaymentDecisionProfile = createPaymentDecisionFixtureProfile("paypal"),
) {
  return buildPaymentDecisionReport(
    {
      ...basePaymentDecisionInput,
      ...input,
    },
    profile,
    { generatedAt },
  );
}

test("rule primary_without_backup recommends verified backup", () => {
  const result = report({
    amountRange: "under_500",
    paymentFrequency: "regular",
    usageRole: "primary",
    hasBackupRoute: false,
  });

  assert.equal(result.recommendationCode, "USE_WITH_VERIFIED_BACKUP");
  assert.ok(result.matchedRuleKeys.includes("primary_without_backup"));
  assert.ok(result.checklist.some((item) => item.code === "ADD_SECONDARY_PAYOUT_ROUTE"));
});

test("rule fund_hold_authority adds backup and records actions", () => {
  const result = report({
    amountRange: "under_500",
    paymentFrequency: "regular",
    usageRole: "primary",
    hasBackupRoute: true,
  });

  assert.ok(result.matchedRuleKeys.includes("fund_hold_authority"));
  assert.ok(result.checklist.some((item) => item.code === "PRESERVE_PAYMENT_SOURCE_RECORDS"));
});

test("rule high_irregular_payment adds withdrawal verification", () => {
  const result = report({
    amountRange: "500_to_5000",
    paymentFrequency: "irregular",
    usageRole: "evaluating",
    hasBackupRoute: true,
  });

  assert.ok(result.matchedRuleKeys.includes("high_irregular_payment"));
  assert.ok(result.checklist.some((item) => item.code === "VERIFY_WITHDRAWAL_PATH"));
});

test("rule additional_verification recommends early verification", () => {
  const result = report({
    amountRange: "500_to_5000",
    usageRole: "evaluating",
    hasBackupRoute: true,
  });

  assert.equal(result.recommendationCode, "COMPLETE_VERIFICATION_BEFORE_LARGE_PAYMENT");
  assert.ok(result.matchedRuleKeys.includes("additional_verification"));
  assert.ok(result.checklist.some((item) => item.code === "COMPLETE_IDENTITY_VERIFICATION"));
});

test("rule withdrawal_restriction minimizes stored balance", () => {
  const result = report({
    amountRange: "under_500",
    paymentFrequency: "regular",
    usageRole: "evaluating",
    hasBackupRoute: true,
  });

  assert.equal(result.recommendationCode, "MINIMIZE_STORED_BALANCE");
  assert.ok(result.matchedRuleKeys.includes("withdrawal_restriction"));
  assert.ok(result.checklist.some((item) => item.code === "MINIMIZE_PLATFORM_BALANCE"));
});

test("rule weak_appeal_path lowers confidence and preserves correspondence", () => {
  const result = report(
    {
      amountRange: "under_500",
      paymentFrequency: "regular",
      usageRole: "evaluating",
      hasBackupRoute: true,
    },
    createPaymentDecisionFixtureProfile("paypal", {
      coverage: { appealClarity: "unknown" },
    }),
  );

  assert.ok(result.matchedRuleKeys.includes("weak_appeal_path"));
  assert.ok(result.checklist.some((item) => item.code === "SAVE_SUPPORT_CORRESPONDENCE"));
  assert.ok(result.limitations.some((item) => item.includes("Appeal or support path clarity")));
});

test("rule country_uncertainty is matched and no_reliable_decision wins priority", () => {
  const result = buildPaymentDecisionReport(
    paymentDecisionScenarios.unknownCountrySupport.input,
    paymentDecisionScenarios.unknownCountrySupport.profile,
    { generatedAt },
  );

  assert.equal(result.recommendationCode, "FURTHER_REVIEW_REQUIRED");
  assert.ok(result.matchedRuleKeys.includes("country_uncertainty"));
  assert.ok(result.matchedRuleKeys.includes("no_reliable_decision"));
  assert.equal(result.confidence.level, "low");
});

test("rule payer_compatibility_uncertainty adds payer limitation", () => {
  const result = report(
    {
      amountRange: "under_500",
      paymentFrequency: "regular",
      usageRole: "evaluating",
      hasBackupRoute: true,
    },
    createPaymentDecisionFixtureProfile("paypal", {
      coverage: { payerCompatibility: "unknown" },
    }),
  );

  assert.equal(result.recommendationCode, "FURTHER_REVIEW_REQUIRED");
  assert.ok(result.matchedRuleKeys.includes("payer_compatibility_uncertainty"));
  assert.ok(result.checklist.some((item) => item.code === "CONFIRM_PAYER_SUPPORT"));
});

test("rule chargeback_exposure preserves delivery evidence", () => {
  const result = report({
    amountRange: "under_500",
    paymentFrequency: "regular",
    workType: "freelancer",
    usageRole: "evaluating",
    hasBackupRoute: true,
    concerns: ["chargeback"],
  });

  assert.ok(result.matchedRuleKeys.includes("chargeback_exposure"));
  assert.ok(result.checklist.some((item) => item.code === "PRESERVE_DELIVERY_EVIDENCE"));
});

test("rule primary_unclear_support outranks primary_without_backup", () => {
  const result = report(
    {
      amountRange: "under_500",
      paymentFrequency: "regular",
      usageRole: "primary",
      hasBackupRoute: false,
    },
    createPaymentDecisionFixtureProfile("paypal", {
      coverage: { appealClarity: "low" },
    }),
  );

  assert.equal(result.recommendationCode, "AVOID_SINGLE_PLATFORM_DEPENDENCY");
  assert.ok(result.matchedRuleKeys.includes("primary_unclear_support"));
  assert.ok(result.matchedRuleKeys.includes("primary_without_backup"));
});

test("rule backup_only_use can recommend secondary method with complete evidence", () => {
  const profile = withoutRisks(
    createPaymentDecisionFixtureProfile("wise"),
    ["fund_hold", "reserve", "withdrawal_restriction", "kyc_verification", "chargeback", "account_limitation"],
    { withdrawalPath: "documented" },
  );
  const result = report(
    {
      amountRange: "under_500",
      paymentFrequency: "regular",
      usageRole: "backup",
      hasBackupRoute: true,
    },
    profile,
  );

  assert.equal(result.recommendationCode, "SUITABLE_AS_SECONDARY_METHOD");
  assert.ok(result.matchedRuleKeys.includes("backup_only_use"));
  assert.ok(result.checklist.some((item) => item.code === "TEST_SMALL_WITHDRAWAL"));
});

test("rule high_balance_exposure adds planned withdrawal action", () => {
  const result = report({
    amountRange: "over_5000",
    paymentFrequency: "regular",
    usageRole: "evaluating",
    hasBackupRoute: true,
  });

  assert.ok(result.matchedRuleKeys.includes("high_balance_exposure"));
  assert.ok(result.checklist.some((item) => item.code === "PLAN_WITHDRAWAL_SCHEDULE"));
});

test("rule incomplete_evidence lowers confidence and further-review recommendation", () => {
  const result = buildPaymentDecisionReport(
    paymentDecisionScenarios.partialEvidencePlatform.input,
    paymentDecisionScenarios.partialEvidencePlatform.profile,
    { generatedAt },
  );

  assert.equal(result.recommendationCode, "FURTHER_REVIEW_REQUIRED");
  assert.ok(result.matchedRuleKeys.includes("incomplete_evidence"));
  assert.notEqual(result.confidence.level, "high");
});

test("rule verification_readiness_unknown applies to medium and high payments", () => {
  const result = report({
    amountRange: "500_to_5000",
    paymentFrequency: "regular",
    usageRole: "evaluating",
    hasBackupRoute: true,
  });

  assert.ok(result.matchedRuleKeys.includes("verification_readiness_unknown"));
  assert.ok(result.limitations.some((item) => item.includes("verification readiness is unknown")));
});

test("rule no_reliable_decision is deterministic fallback for required unknowns", () => {
  const result = buildPaymentDecisionReport(
    paymentDecisionScenarios.highPaymentUnclearWithdrawal.input,
    paymentDecisionScenarios.highPaymentUnclearWithdrawal.profile,
    { generatedAt },
  );

  assert.equal(result.recommendationCode, "FURTHER_REVIEW_REQUIRED");
  assert.ok(result.matchedRuleKeys.includes("no_reliable_decision"));
  assert.ok(result.limitations.some((item) => item.includes("Withdrawal availability")));
});

test("deterministic fallback returns further review when no rule matches", () => {
  const profile = withoutRisks(
    createPaymentDecisionFixtureProfile("wise"),
    ["fund_hold", "reserve", "withdrawal_restriction", "account_limitation", "kyc_verification", "chargeback", "appeal_support"],
    {
      countryEligibility: "documented",
      payerCompatibility: "documented",
      withdrawalPath: "documented",
      appealClarity: "documented",
    },
  );
  const result = report(
    {
      amountRange: "under_500",
      paymentFrequency: "regular",
      usageRole: "evaluating",
      hasBackupRoute: true,
      concerns: [],
    },
    profile,
  );

  assert.equal(result.recommendationCode, "FURTHER_REVIEW_REQUIRED");
  assert.deepEqual(result.matchedRuleKeys, []);
});

test("input schema rejects unsupported platform and arbitrary concern", () => {
  assert.equal(
    paymentDecisionInputSchema.safeParse({
      ...basePaymentDecisionInput,
      platformSlug: "cashapp",
    }).success,
    false,
  );
  assert.equal(
    paymentDecisionInputSchema.safeParse({
      ...basePaymentDecisionInput,
      concerns: ["fund_hold", "arbitrary_json"],
    }).success,
    false,
  );
});

test("correction schema rejects unsafe external URLs", () => {
  assert.equal(
    paymentCorrectionFormSchema.safeParse({
      platformSlug: "paypal",
      issueType: "broken_official_link",
      message: "This official link appears to be broken.",
      sourceUrl: "javascript:alert(1)",
      contactEmail: "",
      website: "",
    }).success,
    false,
  );
});

test("report token has entropy and valid URL-safe shape", () => {
  const tokens = Array.from({ length: 1000 }, createReportToken);

  assert.equal(new Set(tokens).size, tokens.length);
  assert.ok(tokens.every(isValidReportToken));
  assert.ok(tokens.every((token) => token.length >= 43));
});

test("public report snapshot does not expose internal metadata", () => {
  const result = report();
  const serialized = JSON.stringify(result);

  assert.equal(serialized.includes("internalRiskId"), false);
  assert.equal(serialized.includes("internalEvidenceId"), false);
  assert.equal(serialized.includes("source_snapshot"), false);
  assert.equal(serialized.includes("research_packet"), false);
  assert.equal(serialized.includes("editorial_telemetry"), false);
  assert.equal(serialized.includes("platform_paypal"), false);
});

test("comparison reports trade-offs without universal platform ranking", () => {
  const comparison = buildPaymentPlatformComparison(
    comparisonScenario,
    createPaymentDecisionFixtureProfile("wise"),
    createPaymentDecisionFixtureProfile("paypal", {
      readinessState: "partial_evidence",
      coverage: { payerCompatibility: "unknown" },
    }),
    { generatedAt },
  );

  assert.equal(comparison.platforms.length, 2);
  assert.ok(comparison.betterFitForPrimaryUse.includes("where country, payer, and withdrawal support are confirmed"));
  assert.ok(comparison.unresolvedTradeoffs.some((item) => item.includes("Payer compatibility")));
  assert.equal(comparison.betterFitForPrimaryUse.includes("safest"), false);
});

test("documented scenarios produce distinct recommendation outcomes", () => {
  const results = Object.values(paymentDecisionScenarios).map((scenario) =>
    buildPaymentDecisionReport(scenario.input, scenario.profile, { generatedAt }),
  );
  const recommendations = new Set(results.map((result) => result.recommendationCode));
  const byScenario = Object.fromEntries(
    Object.entries(paymentDecisionScenarios).map(([key, scenario]) => [
      key,
      buildPaymentDecisionReport(scenario.input, scenario.profile, { generatedAt })
        .recommendationCode,
    ]),
  );

  assert.ok(recommendations.size >= 5);
  assert.equal(
    byScenario.vietnamBugBountyPaypalNoBackup,
    "AVOID_SINGLE_PLATFORM_DEPENDENCY",
  );
  assert.equal(byScenario.creatorPayoneerBackupUse, "SUITABLE_AS_SECONDARY_METHOD");
  assert.equal(byScenario.indieHackerStripeChargeback, "USE_WITH_VERIFIED_BACKUP");
  assert.equal(byScenario.partialEvidencePlatform, "FURTHER_REVIEW_REQUIRED");
});
