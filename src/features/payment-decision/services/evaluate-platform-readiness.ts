import type {
  EvidenceClarity,
  PlatformReadinessState,
} from "@/features/payment-decision/types/payment-decision.types";

export type PlatformReadinessInput = {
  hasPlatformProfile: boolean;
  isPaymentPlatform: boolean;
  officialSourceCount: number;
  relevantRiskCount: number;
  approvedEvidenceCount: number;
  hasReviewedDate: boolean;
  countryEligibility: EvidenceClarity;
  applicableActionCount: number;
};

export function evaluatePlatformReadiness(input: PlatformReadinessInput): {
  state: PlatformReadinessState;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (!input.hasPlatformProfile) {
    return {
      state: "not_reviewed",
      reasons: ["No published platform profile exists for the payment decision workflow."],
    };
  }

  if (!input.isPaymentPlatform) {
    reasons.push("Platform profile is not classified as a payment platform.");
  }

  if (input.officialSourceCount === 0) {
    reasons.push("No active reviewed source with a safe HTTP/HTTPS URL is available.");
  }

  if (input.relevantRiskCount === 0) {
    reasons.push("No published relevant risk is mapped to a payment decision category.");
  }

  if (input.approvedEvidenceCount === 0) {
    reasons.push("No approved evidence is available for the mapped payment risks.");
  }

  if (!input.hasReviewedDate) {
    reasons.push("Reviewed-date coverage is missing.");
  }

  if (input.applicableActionCount === 0) {
    reasons.push("No applicable preparation action is available.");
  }

  if (
    input.countryEligibility === "missing" ||
    input.countryEligibility === "unknown" ||
    input.countryEligibility === "limited"
  ) {
    reasons.push("Country eligibility requires explicit verification.");
    return {
      state: "country_verification_required",
      reasons,
    };
  }

  if (reasons.length > 0) {
    return {
      state: "partial_evidence",
      reasons,
    };
  }

  return {
    state: "decision_ready",
    reasons: ["Platform profile meets the Sprint 11 decision-readiness gate."],
  };
}
