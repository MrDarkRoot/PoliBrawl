import type { RecommendationCode } from "@/features/payment-decision/types/payment-decision.types";

export type RecommendationDefinition = {
  code: RecommendationCode;
  title: string;
  summary: string;
};

export const recommendationDefinitions: Record<
  RecommendationCode,
  RecommendationDefinition
> = {
  SUITABLE_AS_SECONDARY_METHOD: {
    code: "SUITABLE_AS_SECONDARY_METHOD",
    title: "Suitable as a secondary payout method",
    summary:
      "The evidence supports using this platform as a backup route, provided country and withdrawal support remain verified.",
  },
  USE_WITH_VERIFIED_BACKUP: {
    code: "USE_WITH_VERIFIED_BACKUP",
    title: "Use only with a verified backup",
    summary:
      "Do not make this your only payout path until a second route is tested and ready to receive funds.",
  },
  AVOID_SINGLE_PLATFORM_DEPENDENCY: {
    code: "AVOID_SINGLE_PLATFORM_DEPENDENCY",
    title: "Avoid single-platform dependency",
    summary:
      "The available evidence points to operational interruption risk, so relying on this platform alone is not supported.",
  },
  COMPLETE_VERIFICATION_BEFORE_LARGE_PAYMENT: {
    code: "COMPLETE_VERIFICATION_BEFORE_LARGE_PAYMENT",
    title: "Complete verification before a larger payment",
    summary:
      "Prepare identity, business, and payment-source records before routing a medium or high-value payout through this platform.",
  },
  MINIMIZE_STORED_BALANCE: {
    code: "MINIMIZE_STORED_BALANCE",
    title: "Minimize stored platform balance",
    summary:
      "Plan withdrawals and exports so a limitation, reserve, or payout delay does not trap more money than necessary.",
  },
  VERIFY_COUNTRY_ELIGIBILITY: {
    code: "VERIFY_COUNTRY_ELIGIBILITY",
    title: "Verify country eligibility first",
    summary:
      "Country-specific support is not sufficiently verified for this decision. Confirm eligibility before depending on the route.",
  },
  VERIFY_PAYER_COMPATIBILITY: {
    code: "VERIFY_PAYER_COMPATIBILITY",
    title: "Verify payer compatibility first",
    summary:
      "Confirm that the payer can use this platform for your payout type before treating it as a usable route.",
  },
  FURTHER_REVIEW_REQUIRED: {
    code: "FURTHER_REVIEW_REQUIRED",
    title: "Further review required",
    summary:
      "The evidence is not complete enough to support a dependency recommendation for this situation.",
  },
};

export function getRecommendationDefinition(code: RecommendationCode) {
  return recommendationDefinitions[code];
}
