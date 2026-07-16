import type {
  InternalDecisionEvidence,
  InternalMatchedDecisionRisk,
  PaymentComparisonInput,
  PaymentDecisionInput,
  PaymentDecisionProfile,
  PaymentDecisionPlatformSlug,
  PaymentRiskCategory,
} from "@/features/payment-decision/types/payment-decision.types";

const reviewedAt = "2026-06-15T00:00:00.000Z";

export function assertPaymentDecisionFixturesAllowed() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Payment decision fixtures must not run in production.");
  }
}

function evidence(category: PaymentRiskCategory): InternalDecisionEvidence {
  return {
    internalEvidenceId: `ev_${category}`,
    internalRiskId: `risk_${category}`,
    internalSourceId: `source_${category}`,
    title: `${category.replace(/_/g, " ")} evidence`,
    excerpt:
      category === "fund_hold"
        ? "The platform may hold funds while it reviews account, payer, or transaction activity."
        : `Reviewed public policy evidence for ${category.replace(/_/g, " ")}.`,
    sourceTitle: "Official payment policy",
    sourceUrl: `https://example.com/${category}`,
    reviewedAt,
    publishedAt: reviewedAt,
    riskCategory: category,
    confidence: "high",
  };
}

function risk(category: PaymentRiskCategory): InternalMatchedDecisionRisk {
  const copy = category.replace(/_/g, " ");

  return {
    internalRiskId: `risk_${category}`,
    category,
    title: `${copy} risk`,
    relevance: `Evidence is relevant to ${copy}.`,
    possibleImpact: `A payment route can be interrupted by ${copy}.`,
    level: "high",
    evidence: [evidence(category)],
  };
}

export function createPaymentDecisionFixtureProfile(
  slug: PaymentDecisionPlatformSlug,
  overrides: Partial<Omit<PaymentDecisionProfile, "platform" | "coverage">> & {
    platform?: Partial<PaymentDecisionProfile["platform"]>;
    coverage?: Partial<PaymentDecisionProfile["coverage"]>;
  } = {},
): PaymentDecisionProfile {
  const risks = [
    risk("fund_hold"),
    risk("withdrawal_restriction"),
    risk("kyc_verification"),
    risk("appeal_support"),
    risk("country_eligibility"),
    risk("payer_compatibility"),
    risk("chargeback"),
  ];
  const base: PaymentDecisionProfile = {
    platform: {
      id: `platform_${slug}`,
      slug,
      name: slug[0].toUpperCase() + slug.slice(1),
      websiteUrl: `https://example.com/${slug}`,
      category: "payment",
      lastReviewedAt: reviewedAt,
      publishedAt: reviewedAt,
    },
    readinessState: "decision_ready",
    readinessReasons: ["Fixture profile is decision-ready."],
    risks,
    evidence: risks.flatMap((item) => item.evidence),
    coverage: {
      countryEligibility: "documented",
      payerCompatibility: "documented",
      withdrawalPath: "documented",
      appealClarity: "documented",
      officialSourceCount: 3,
      approvedEvidenceCount: risks.length,
      latestReviewedAt: reviewedAt,
      oldEvidence: false,
      discretionaryLanguage: false,
    },
  };

  return {
    ...base,
    ...overrides,
    platform: {
      ...base.platform,
      ...overrides.platform,
    },
    coverage: {
      ...base.coverage,
      ...overrides.coverage,
    },
  };
}

export const basePaymentDecisionInput: PaymentDecisionInput = {
  country: "vietnam",
  workType: "bug_bounty",
  platformSlug: "paypal",
  amountRange: "500_to_5000",
  paymentFrequency: "irregular",
  usageRole: "primary",
  hasBackupRoute: false,
  concerns: ["fund_hold", "withdrawal"],
};

export const paymentDecisionScenarios = {
  vietnamBugBountyPaypalNoBackup: {
    input: basePaymentDecisionInput,
    profile: createPaymentDecisionFixtureProfile("paypal", {
      coverage: { appealClarity: "low" },
    }),
  },
  vietnamFreelancerWiseWithBackup: {
    input: {
      ...basePaymentDecisionInput,
      workType: "freelancer",
      platformSlug: "wise",
      paymentFrequency: "regular",
      hasBackupRoute: true,
      concerns: ["withdrawal", "country_eligibility"],
    },
    profile: createPaymentDecisionFixtureProfile("wise"),
  },
  creatorPayoneerBackupUse: {
    input: {
      ...basePaymentDecisionInput,
      workType: "creator",
      platformSlug: "payoneer",
      usageRole: "backup",
      hasBackupRoute: true,
    },
    profile: createPaymentDecisionFixtureProfile("payoneer"),
  },
  indieHackerStripeChargeback: {
    input: {
      ...basePaymentDecisionInput,
      workType: "indie_hacker",
      platformSlug: "stripe",
      amountRange: "under_500",
      paymentFrequency: "regular",
      usageRole: "evaluating",
      hasBackupRoute: true,
      concerns: ["chargeback"],
    },
    profile: createPaymentDecisionFixtureProfile("stripe"),
  },
  consultantDeelHighVerification: {
    input: {
      ...basePaymentDecisionInput,
      workType: "consultant",
      platformSlug: "deel",
      amountRange: "over_5000",
      paymentFrequency: "one_time",
      concerns: ["kyc"],
    },
    profile: createPaymentDecisionFixtureProfile("deel"),
  },
  unknownCountrySupport: {
    input: {
      ...basePaymentDecisionInput,
      country: "country_verification_required",
      concerns: ["country_eligibility"],
    },
    profile: createPaymentDecisionFixtureProfile("paypal", {
      readinessState: "country_verification_required",
      coverage: { countryEligibility: "missing" },
    }),
  },
  highPaymentUnclearWithdrawal: {
    input: {
      ...basePaymentDecisionInput,
      amountRange: "over_5000",
      concerns: ["withdrawal"],
    },
    profile: createPaymentDecisionFixtureProfile("paypal", {
      readinessState: "partial_evidence",
      coverage: { withdrawalPath: "unknown" },
    }),
  },
  backupOnlyCompleteEvidence: {
    input: {
      ...basePaymentDecisionInput,
      usageRole: "backup",
      hasBackupRoute: true,
    },
    profile: createPaymentDecisionFixtureProfile("wise"),
  },
  partialEvidencePlatform: {
    input: {
      ...basePaymentDecisionInput,
      platformSlug: "payoneer",
    },
    profile: createPaymentDecisionFixtureProfile("payoneer", {
      readinessState: "partial_evidence",
      readinessReasons: ["Fixture profile has partial evidence."],
      coverage: { officialSourceCount: 1, approvedEvidenceCount: 1 },
    }),
  },
} satisfies Record<
  string,
  {
    input: PaymentDecisionInput;
    profile: PaymentDecisionProfile;
  }
>;

export const comparisonScenario: PaymentComparisonInput = {
  ...basePaymentDecisionInput,
  platformSlug: "wise",
  comparisonPlatformSlug: "paypal",
  usageRole: "evaluating",
  hasBackupRoute: true,
};
