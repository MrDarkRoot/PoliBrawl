import type {
  ActionCode,
  DecisionRuleMatch,
  LimitationCode,
  PaymentDecisionRule,
  PaymentRiskCategory,
  RecommendationCode,
  RuleEvaluationContext,
} from "@/features/payment-decision/types/payment-decision.types";

function hasRisk(context: RuleEvaluationContext, categories: PaymentRiskCategory[]) {
  return context.profile.risks.some((risk) => categories.includes(risk.category));
}

function firstRiskTitle(
  context: RuleEvaluationContext,
  categories: PaymentRiskCategory[],
) {
  return context.profile.risks.find((risk) => categories.includes(risk.category))
    ?.evidence[0]?.title;
}

function isMediumOrHighPayment(context: RuleEvaluationContext) {
  return (
    context.input.amountRange === "500_to_5000" ||
    context.input.amountRange === "over_5000"
  );
}

function isHighPayment(context: RuleEvaluationContext) {
  return context.input.amountRange === "over_5000";
}

function makeMatch(params: {
  ruleKey: string;
  priority: number;
  recommendationCode: RecommendationCode;
  reasonTitle: string;
  reasonDetail: string;
  actionCodes: ActionCode[];
  requiredRiskCategories?: PaymentRiskCategory[];
  confidenceAdjustment?: number;
  limitationCodes?: LimitationCode[];
  evidenceTitle?: string;
}): DecisionRuleMatch {
  return {
    ruleKey: params.ruleKey,
    priority: params.priority,
    recommendationCode: params.recommendationCode,
    reason: {
      code: params.ruleKey,
      title: params.reasonTitle,
      detail: params.reasonDetail,
      ruleKey: params.ruleKey,
      evidenceTitle: params.evidenceTitle,
    },
    actionCodes: params.actionCodes,
    requiredRiskCategories: params.requiredRiskCategories ?? [],
    confidenceAdjustment: params.confidenceAdjustment ?? 0,
    limitationCodes: params.limitationCodes ?? [],
  };
}

export const paymentDependencyRules: PaymentDecisionRule[] = [
  {
    key: "primary_without_backup",
    priority: 70,
    evaluate(context) {
      if (context.input.usageRole !== "primary" || context.input.hasBackupRoute) {
        return null;
      }

      return makeMatch({
        ruleKey: "primary_without_backup",
        priority: 70,
        recommendationCode: "USE_WITH_VERIFIED_BACKUP",
        reasonTitle: "Primary payout route has no verified backup",
        reasonDetail:
          "You intend to use this as the primary payout route and do not already have a tested secondary route.",
        actionCodes: ["ADD_SECONDARY_PAYOUT_ROUTE", "TEST_SMALL_WITHDRAWAL"],
        confidenceAdjustment: 0,
      });
    },
  },
  {
    key: "fund_hold_authority",
    priority: 64,
    evaluate(context) {
      const categories: PaymentRiskCategory[] = ["fund_hold", "reserve"];
      if (context.input.usageRole !== "primary" || !hasRisk(context, categories)) {
        return null;
      }

      return makeMatch({
        ruleKey: "fund_hold_authority",
        priority: 64,
        recommendationCode: "USE_WITH_VERIFIED_BACKUP",
        reasonTitle: "Fund access can be delayed or reserved",
        reasonDetail:
          "Matched evidence includes fund hold or reserve authority, which matters more when the platform is the primary payout route.",
        actionCodes: [
          "ADD_SECONDARY_PAYOUT_ROUTE",
          "PRESERVE_PAYMENT_SOURCE_RECORDS",
          "EXPORT_TRANSACTION_HISTORY",
        ],
        requiredRiskCategories: categories,
        evidenceTitle: firstRiskTitle(context, categories),
      });
    },
  },
  {
    key: "high_irregular_payment",
    priority: 55,
    evaluate(context) {
      const mediumIrregular =
        context.input.amountRange === "500_to_5000" &&
        context.input.paymentFrequency === "irregular";

      if (!isHighPayment(context) && !mediumIrregular) {
        return null;
      }

      return makeMatch({
        ruleKey: "high_irregular_payment",
        priority: 55,
        recommendationCode: "MINIMIZE_STORED_BALANCE",
        reasonTitle: "Payment size and timing increase operational exposure",
        reasonDetail:
          "A larger or irregular international payment creates more pressure if withdrawal, KYC, or support review is triggered.",
        actionCodes: [
          "VERIFY_WITHDRAWAL_PATH",
          "TEST_SMALL_WITHDRAWAL",
          "PLAN_WITHDRAWAL_SCHEDULE",
        ],
        confidenceAdjustment: 0,
      });
    },
  },
  {
    key: "additional_verification",
    priority: 75,
    evaluate(context) {
      const categories: PaymentRiskCategory[] = ["kyc_verification"];
      if (!isMediumOrHighPayment(context) || !hasRisk(context, categories)) {
        return null;
      }

      return makeMatch({
        ruleKey: "additional_verification",
        priority: 75,
        recommendationCode: "COMPLETE_VERIFICATION_BEFORE_LARGE_PAYMENT",
        reasonTitle: "Verification evidence matches the payment size",
        reasonDetail:
          "The platform has KYC or verification evidence, and the expected payment is large enough that unresolved verification can interrupt access.",
        actionCodes: [
          "COMPLETE_IDENTITY_VERIFICATION",
          "PREPARE_BUSINESS_DOCUMENTS",
          "PRESERVE_PAYMENT_SOURCE_RECORDS",
        ],
        requiredRiskCategories: categories,
        limitationCodes: ["VERIFICATION_READINESS_UNKNOWN"],
        evidenceTitle: firstRiskTitle(context, categories),
      });
    },
  },
  {
    key: "withdrawal_restriction",
    priority: 60,
    evaluate(context) {
      const categories: PaymentRiskCategory[] = ["withdrawal_restriction"];
      if (!hasRisk(context, categories)) {
        return null;
      }

      return makeMatch({
        ruleKey: "withdrawal_restriction",
        priority: 60,
        recommendationCode: "MINIMIZE_STORED_BALANCE",
        reasonTitle: "Withdrawal restriction evidence is present",
        reasonDetail:
          "Matched evidence describes withdrawal or payout restrictions, so stored balance should be minimized after withdrawal is available.",
        actionCodes: [
          "VERIFY_WITHDRAWAL_PATH",
          "MINIMIZE_PLATFORM_BALANCE",
          "PLAN_WITHDRAWAL_SCHEDULE",
        ],
        requiredRiskCategories: categories,
        evidenceTitle: firstRiskTitle(context, categories),
      });
    },
  },
  {
    key: "weak_appeal_path",
    priority: 45,
    evaluate(context) {
      if (
        context.profile.coverage.appealClarity !== "low" &&
        context.profile.coverage.appealClarity !== "unknown" &&
        context.profile.coverage.appealClarity !== "missing"
      ) {
        return null;
      }

      return makeMatch({
        ruleKey: "weak_appeal_path",
        priority: 45,
        recommendationCode: "USE_WITH_VERIFIED_BACKUP",
        reasonTitle: "Appeal or support clarity is weak",
        reasonDetail:
          "The available evidence does not clearly document how account review, limitation, or appeal issues are resolved.",
        actionCodes: ["SAVE_SUPPORT_CORRESPONDENCE", "EXPORT_TRANSACTION_HISTORY"],
        confidenceAdjustment: -1,
        limitationCodes: ["APPEAL_PATH_UNCLEAR"],
      });
    },
  },
  {
    key: "country_uncertainty",
    priority: 90,
    evaluate(context) {
      if (
        context.profile.coverage.countryEligibility !== "missing" &&
        context.profile.coverage.countryEligibility !== "unknown" &&
        context.profile.coverage.countryEligibility !== "limited" &&
        context.input.country !== "country_verification_required"
      ) {
        return null;
      }

      return makeMatch({
        ruleKey: "country_uncertainty",
        priority: 90,
        recommendationCode: "VERIFY_COUNTRY_ELIGIBILITY",
        reasonTitle: "Country eligibility is not confirmed",
        reasonDetail:
          "The decision cannot assume Vietnam or other country support unless official eligibility and withdrawal coverage are verified.",
        actionCodes: ["VERIFY_COUNTRY_SUPPORT", "CONFIRM_PAYER_SUPPORT"],
        confidenceAdjustment: -2,
        limitationCodes: ["COUNTRY_ELIGIBILITY_UNVERIFIED"],
        requiredRiskCategories: ["country_eligibility"],
      });
    },
  },
  {
    key: "payer_compatibility_uncertainty",
    priority: 80,
    evaluate(context) {
      if (
        context.profile.coverage.payerCompatibility !== "missing" &&
        context.profile.coverage.payerCompatibility !== "unknown" &&
        context.profile.coverage.payerCompatibility !== "limited"
      ) {
        return null;
      }

      return makeMatch({
        ruleKey: "payer_compatibility_uncertainty",
        priority: 80,
        recommendationCode: "VERIFY_PAYER_COMPATIBILITY",
        reasonTitle: "Payer compatibility is not verified",
        reasonDetail:
          "The stored evidence does not verify that your payer can send this type of international payout through the platform.",
        actionCodes: ["CONFIRM_PAYER_SUPPORT"],
        confidenceAdjustment: -1,
        limitationCodes: ["PAYER_COMPATIBILITY_UNVERIFIED"],
        requiredRiskCategories: ["payer_compatibility"],
      });
    },
  },
  {
    key: "chargeback_exposure",
    priority: 63,
    evaluate(context) {
      const categories: PaymentRiskCategory[] = ["chargeback"];
      const commercialWork = [
        "freelancer",
        "creator",
        "consultant",
        "indie_hacker",
      ].includes(context.input.workType);

      if (!commercialWork || !hasRisk(context, categories)) {
        return null;
      }

      return makeMatch({
        ruleKey: "chargeback_exposure",
        priority: 63,
        recommendationCode: "USE_WITH_VERIFIED_BACKUP",
        reasonTitle: "Commercial payment can carry dispute exposure",
        reasonDetail:
          "For service or merchant-style work, chargeback or dispute evidence makes delivery and acceptance records operationally important.",
        actionCodes: [
          "PRESERVE_INVOICES",
          "PRESERVE_DELIVERY_EVIDENCE",
          "PRESERVE_PAYMENT_SOURCE_RECORDS",
        ],
        requiredRiskCategories: categories,
        evidenceTitle: firstRiskTitle(context, categories),
      });
    },
  },
  {
    key: "primary_unclear_support",
    priority: 85,
    evaluate(context) {
      if (
        context.input.usageRole !== "primary" ||
        context.profile.coverage.appealClarity !== "low"
      ) {
        return null;
      }

      return makeMatch({
        ruleKey: "primary_unclear_support",
        priority: 85,
        recommendationCode: "AVOID_SINGLE_PLATFORM_DEPENDENCY",
        reasonTitle: "Primary dependency plus unclear support is too brittle",
        reasonDetail:
          "A primary payout route needs a clear support or appeal path. The current evidence does not provide that clarity.",
        actionCodes: ["ADD_SECONDARY_PAYOUT_ROUTE", "SAVE_SUPPORT_CORRESPONDENCE"],
        confidenceAdjustment: -1,
        limitationCodes: ["APPEAL_PATH_UNCLEAR"],
      });
    },
  },
  {
    key: "backup_only_use",
    priority: 78,
    evaluate(context) {
      if (context.input.usageRole !== "backup") {
        return null;
      }

      if (
        context.profile.readinessState === "not_reviewed" ||
        context.profile.coverage.countryEligibility === "missing"
      ) {
        return null;
      }

      return makeMatch({
        ruleKey: "backup_only_use",
        priority: 78,
        recommendationCode: "SUITABLE_AS_SECONDARY_METHOD",
        reasonTitle: "Backup use limits dependency exposure",
        reasonDetail:
          "Using the platform as a secondary method is less brittle than using it as the only payout route, assuming country support remains verified.",
        actionCodes: ["TEST_SMALL_WITHDRAWAL", "EXPORT_TRANSACTION_HISTORY"],
        confidenceAdjustment: 1,
      });
    },
  },
  {
    key: "high_balance_exposure",
    priority: 62,
    evaluate(context) {
      const categories: PaymentRiskCategory[] = [
        "fund_hold",
        "reserve",
        "withdrawal_restriction",
        "account_limitation",
      ];
      if (!isHighPayment(context) || !hasRisk(context, categories)) {
        return null;
      }

      return makeMatch({
        ruleKey: "high_balance_exposure",
        priority: 62,
        recommendationCode: "MINIMIZE_STORED_BALANCE",
        reasonTitle: "High payment plus access restriction evidence",
        reasonDetail:
          "A high payout increases the impact of any access restriction, reserve, or withdrawal delay.",
        actionCodes: [
          "PLAN_WITHDRAWAL_SCHEDULE",
          "MINIMIZE_PLATFORM_BALANCE",
          "EXPORT_TRANSACTION_HISTORY",
        ],
        requiredRiskCategories: categories,
        evidenceTitle: firstRiskTitle(context, categories),
      });
    },
  },
  {
    key: "incomplete_evidence",
    priority: 92,
    evaluate(context) {
      if (context.profile.readinessState === "decision_ready") {
        return null;
      }

      return makeMatch({
        ruleKey: "incomplete_evidence",
        priority: 92,
        recommendationCode: "FURTHER_REVIEW_REQUIRED",
        reasonTitle: "Evidence coverage is incomplete",
        reasonDetail:
          "The platform profile is not fully decision-ready for this workflow, so the report must lower confidence and show limitations.",
        actionCodes: ["VERIFY_COUNTRY_SUPPORT", "CONFIRM_PAYER_SUPPORT"],
        confidenceAdjustment: -2,
        limitationCodes: ["PARTIAL_EVIDENCE"],
      });
    },
  },
  {
    key: "verification_readiness_unknown",
    priority: 76,
    evaluate(context) {
      if (!isMediumOrHighPayment(context)) {
        return null;
      }

      return makeMatch({
        ruleKey: "verification_readiness_unknown",
        priority: 76,
        recommendationCode: "COMPLETE_VERIFICATION_BEFORE_LARGE_PAYMENT",
        reasonTitle: "Verification readiness is unknown",
        reasonDetail:
          "The questionnaire intentionally avoids personal identity details, so verification readiness is treated as unknown for medium and high payments.",
        actionCodes: [
          "COMPLETE_IDENTITY_VERIFICATION",
          "PREPARE_BUSINESS_DOCUMENTS",
          "PRESERVE_PAYMENT_SOURCE_RECORDS",
        ],
        confidenceAdjustment: -1,
        limitationCodes: ["VERIFICATION_READINESS_UNKNOWN"],
      });
    },
  },
  {
    key: "no_reliable_decision",
    priority: 100,
    evaluate(context) {
      const countryMissing = ["missing", "unknown"].includes(
        context.profile.coverage.countryEligibility,
      );
      const payerMissing = ["missing", "unknown"].includes(
        context.profile.coverage.payerCompatibility,
      );
      const withdrawalMissing = ["missing", "unknown"].includes(
        context.profile.coverage.withdrawalPath,
      );

      if (!countryMissing && !payerMissing && !withdrawalMissing) {
        return null;
      }

      const limitationCodes: LimitationCode[] = [];
      if (countryMissing) limitationCodes.push("COUNTRY_ELIGIBILITY_UNVERIFIED");
      if (payerMissing) limitationCodes.push("PAYER_COMPATIBILITY_UNVERIFIED");
      if (withdrawalMissing) limitationCodes.push("WITHDRAWAL_PATH_UNVERIFIED");

      return makeMatch({
        ruleKey: "no_reliable_decision",
        priority: 100,
        recommendationCode: "FURTHER_REVIEW_REQUIRED",
        reasonTitle: "A required dependency fact is unverified",
        reasonDetail:
          "Country eligibility, payer compatibility, and withdrawal availability are minimum facts for this payment decision.",
        actionCodes: [
          "VERIFY_COUNTRY_SUPPORT",
          "CONFIRM_PAYER_SUPPORT",
          "VERIFY_WITHDRAWAL_PATH",
        ],
        confidenceAdjustment: -3,
        limitationCodes,
        requiredRiskCategories: [
          "country_eligibility",
          "payer_compatibility",
          "withdrawal_restriction",
        ],
      });
    },
  },
];

export function resolveRecommendation(matches: DecisionRuleMatch[]) {
  if (matches.length === 0) {
    return "FURTHER_REVIEW_REQUIRED" as RecommendationCode;
  }

  return [...matches]
    .filter((match) => match.recommendationCode)
    .sort((left, right) => right.priority - left.priority)[0]
    ?.recommendationCode ?? "FURTHER_REVIEW_REQUIRED";
}
