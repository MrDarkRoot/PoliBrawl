export const paymentDecisionPlatformSlugs = [
  "paypal",
  "wise",
  "payoneer",
  "stripe",
  "deel",
] as const;

export const paymentDecisionCountries = [
  "vietnam",
  "country_verification_required",
] as const;

export const paymentWorkTypes = [
  "bug_bounty",
  "freelancer",
  "creator",
  "consultant",
  "indie_hacker",
  "other",
] as const;

export const paymentAmountRanges = [
  "under_500",
  "500_to_5000",
  "over_5000",
] as const;

export const paymentFrequencies = ["one_time", "irregular", "regular"] as const;
export const paymentUsageRoles = ["primary", "backup", "evaluating"] as const;

export const paymentConcerns = [
  "fund_hold",
  "account_limitation",
  "kyc",
  "withdrawal",
  "chargeback",
  "support_or_appeal",
  "country_eligibility",
] as const;

export const paymentRiskCategories = [
  "fund_hold",
  "reserve",
  "withdrawal_restriction",
  "account_limitation",
  "kyc_verification",
  "chargeback",
  "appeal_support",
  "country_eligibility",
  "payer_compatibility",
] as const;

export const platformReadinessStates = [
  "decision_ready",
  "partial_evidence",
  "country_verification_required",
  "not_reviewed",
] as const;

export type PaymentDecisionPlatformSlug =
  (typeof paymentDecisionPlatformSlugs)[number];
export type PaymentDecisionCountry = (typeof paymentDecisionCountries)[number];
export type PaymentWorkType = (typeof paymentWorkTypes)[number];
export type PaymentAmountRange = (typeof paymentAmountRanges)[number];
export type PaymentFrequency = (typeof paymentFrequencies)[number];
export type PaymentUsageRole = (typeof paymentUsageRoles)[number];
export type PaymentConcern = (typeof paymentConcerns)[number];
export type PaymentRiskCategory = (typeof paymentRiskCategories)[number];
export type PlatformReadinessState = (typeof platformReadinessStates)[number];

export type RecommendationCode =
  | "SUITABLE_AS_SECONDARY_METHOD"
  | "USE_WITH_VERIFIED_BACKUP"
  | "AVOID_SINGLE_PLATFORM_DEPENDENCY"
  | "COMPLETE_VERIFICATION_BEFORE_LARGE_PAYMENT"
  | "MINIMIZE_STORED_BALANCE"
  | "VERIFY_COUNTRY_ELIGIBILITY"
  | "VERIFY_PAYER_COMPATIBILITY"
  | "FURTHER_REVIEW_REQUIRED";

export type ActionCode =
  | "COMPLETE_IDENTITY_VERIFICATION"
  | "PREPARE_BUSINESS_DOCUMENTS"
  | "PRESERVE_PAYMENT_SOURCE_RECORDS"
  | "PRESERVE_INVOICES"
  | "PRESERVE_DELIVERY_EVIDENCE"
  | "VERIFY_WITHDRAWAL_PATH"
  | "TEST_SMALL_WITHDRAWAL"
  | "ADD_SECONDARY_PAYOUT_ROUTE"
  | "MINIMIZE_PLATFORM_BALANCE"
  | "EXPORT_TRANSACTION_HISTORY"
  | "SAVE_SUPPORT_CORRESPONDENCE"
  | "CONFIRM_PAYER_SUPPORT"
  | "VERIFY_COUNTRY_SUPPORT"
  | "PLAN_WITHDRAWAL_SCHEDULE";

export type LimitationCode =
  | "COUNTRY_ELIGIBILITY_UNVERIFIED"
  | "PAYER_COMPATIBILITY_UNVERIFIED"
  | "WITHDRAWAL_PATH_UNVERIFIED"
  | "APPEAL_PATH_UNCLEAR"
  | "PARTIAL_EVIDENCE"
  | "OLD_EVIDENCE"
  | "PLATFORM_NOT_REVIEWED"
  | "VERIFICATION_READINESS_UNKNOWN"
  | "POLICY_DISCRETION_PRESENT";

export type ConfidenceLevel = "low" | "moderate" | "high";
export type EvidenceClarity = "documented" | "limited" | "low" | "unknown" | "missing";

export type PaymentDecisionInput = {
  country: PaymentDecisionCountry;
  workType: PaymentWorkType;
  platformSlug: PaymentDecisionPlatformSlug;
  amountRange: PaymentAmountRange;
  paymentFrequency: PaymentFrequency;
  usageRole: PaymentUsageRole;
  hasBackupRoute: boolean;
  concerns: PaymentConcern[];
};

export type DecisionAction = {
  code: ActionCode;
  title: string;
  description: string;
  category:
    | "verification"
    | "records"
    | "withdrawal"
    | "backup"
    | "support"
    | "payer"
    | "country";
  applicability: string;
  tradeOff?: string;
};

export type DecisionEvidence = {
  title: string;
  excerpt: string;
  sourceTitle: string;
  sourceUrl: string;
  reviewedAt: string | null;
  publishedAt: string | null;
  riskCategory: PaymentRiskCategory;
  confidence: "low" | "moderate" | "high" | "unknown";
};

export type InternalDecisionEvidence = DecisionEvidence & {
  internalEvidenceId: string;
  internalRiskId: string;
  internalSourceId: string;
};

export type MatchedDecisionRisk = {
  category: PaymentRiskCategory;
  title: string;
  relevance: string;
  possibleImpact: string;
  level: "low" | "medium" | "high" | "critical" | "unknown";
  evidence: DecisionEvidence[];
};

export type InternalMatchedDecisionRisk = Omit<MatchedDecisionRisk, "evidence"> & {
  internalRiskId: string;
  evidence: InternalDecisionEvidence[];
};

export type DecisionReason = {
  code: string;
  title: string;
  detail: string;
  ruleKey: string;
  evidenceTitle?: string;
};

export type BackupPlanItem = {
  scenario: "account_limitation" | "withdrawal_delay" | "kyc_request" | "unavailable_payout_route";
  title: string;
  primaryAction: string;
  backupAction: string;
  tradeOff: string;
};

export type PaymentDecisionResult = {
  input: PaymentDecisionInput;
  platform: {
    slug: PaymentDecisionPlatformSlug;
    name: string;
    websiteUrl: string | null;
    readinessState: PlatformReadinessState;
  };
  recommendationCode: RecommendationCode;
  recommendationTitle: string;
  recommendationSummary: string;
  reasons: DecisionReason[];
  risks: MatchedDecisionRisk[];
  checklist: DecisionAction[];
  backupPlan: BackupPlanItem[];
  evidence: DecisionEvidence[];
  confidence: {
    level: ConfidenceLevel;
    reasons: string[];
  };
  limitations: string[];
  matchedRuleKeys: string[];
  generatedAt: string;
  reviewedDataAt?: string;
};

export type RuleEvaluationContext = {
  input: PaymentDecisionInput;
  profile: PaymentDecisionProfile;
};

export type DecisionRuleMatch = {
  ruleKey: string;
  priority: number;
  recommendationCode?: RecommendationCode;
  reason: DecisionReason;
  actionCodes: ActionCode[];
  requiredRiskCategories: PaymentRiskCategory[];
  confidenceAdjustment: number;
  limitationCodes: LimitationCode[];
};

export type PaymentDecisionRule = {
  key: string;
  priority: number;
  evaluate: (context: RuleEvaluationContext) => DecisionRuleMatch | null;
};

export type PaymentDecisionProfile = {
  platform: {
    id: string | null;
    slug: PaymentDecisionPlatformSlug;
    name: string;
    websiteUrl: string | null;
    category: string | null;
    lastReviewedAt: string | null;
    publishedAt: string | null;
  };
  readinessState: PlatformReadinessState;
  readinessReasons: string[];
  risks: InternalMatchedDecisionRisk[];
  evidence: InternalDecisionEvidence[];
  coverage: {
    countryEligibility: EvidenceClarity;
    payerCompatibility: EvidenceClarity;
    withdrawalPath: EvidenceClarity;
    appealClarity: EvidenceClarity;
    officialSourceCount: number;
    approvedEvidenceCount: number;
    latestReviewedAt: string | null;
    oldEvidence: boolean;
    discretionaryLanguage: boolean;
  };
};

export type PaymentDecisionEvaluation = {
  recommendationCode: RecommendationCode;
  matchedRules: DecisionRuleMatch[];
  actionCodes: ActionCode[];
  limitationCodes: LimitationCode[];
  confidence: {
    level: ConfidenceLevel;
    reasons: string[];
  };
};

export type PaymentComparisonInput = PaymentDecisionInput & {
  comparisonPlatformSlug: PaymentDecisionPlatformSlug;
};

export type PaymentPlatformComparison = {
  input: PaymentComparisonInput;
  platforms: Array<{
    slug: PaymentDecisionPlatformSlug;
    name: string;
    readinessState: PlatformReadinessState;
    confidence: ConfidenceLevel;
    countryEvidenceCoverage: EvidenceClarity;
    fundAccessRisk: EvidenceClarity;
    withdrawalRestrictionEvidence: EvidenceClarity;
    verificationRequirements: EvidenceClarity;
    payerCompatibilityLimits: EvidenceClarity;
    appealClarity: EvidenceClarity;
    backupSuitability: string;
    reviewedDataAt: string | null;
  }>;
  betterFitForPrimaryUse: string;
  betterFitForBackupUse: string;
  unresolvedTradeoffs: string[];
  generatedAt: string;
};

export const paymentDecisionDisclaimer =
  "This report provides operational decision support based on reviewed public information. It is not legal, financial, or compliance advice and cannot predict account-specific platform decisions.";
