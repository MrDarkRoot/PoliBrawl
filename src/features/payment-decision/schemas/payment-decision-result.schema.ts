import { z } from "zod";

import {
  paymentAmountRanges,
  paymentConcerns,
  paymentDecisionCountries,
  paymentDecisionPlatformSlugs,
  paymentFrequencies,
  paymentRiskCategories,
  paymentUsageRoles,
  paymentWorkTypes,
  platformReadinessStates,
} from "@/features/payment-decision/types/payment-decision.types";

export const recommendationCodeSchema = z.enum([
  "SUITABLE_AS_SECONDARY_METHOD",
  "USE_WITH_VERIFIED_BACKUP",
  "AVOID_SINGLE_PLATFORM_DEPENDENCY",
  "COMPLETE_VERIFICATION_BEFORE_LARGE_PAYMENT",
  "MINIMIZE_STORED_BALANCE",
  "VERIFY_COUNTRY_ELIGIBILITY",
  "VERIFY_PAYER_COMPATIBILITY",
  "FURTHER_REVIEW_REQUIRED",
]);

export const actionCodeSchema = z.enum([
  "COMPLETE_IDENTITY_VERIFICATION",
  "PREPARE_BUSINESS_DOCUMENTS",
  "PRESERVE_PAYMENT_SOURCE_RECORDS",
  "PRESERVE_INVOICES",
  "PRESERVE_DELIVERY_EVIDENCE",
  "VERIFY_WITHDRAWAL_PATH",
  "TEST_SMALL_WITHDRAWAL",
  "ADD_SECONDARY_PAYOUT_ROUTE",
  "MINIMIZE_PLATFORM_BALANCE",
  "EXPORT_TRANSACTION_HISTORY",
  "SAVE_SUPPORT_CORRESPONDENCE",
  "CONFIRM_PAYER_SUPPORT",
  "VERIFY_COUNTRY_SUPPORT",
  "PLAN_WITHDRAWAL_SCHEDULE",
]);

export const paymentDecisionResultSchema = z.object({
  input: z.object({
    country: z.enum(paymentDecisionCountries),
    workType: z.enum(paymentWorkTypes),
    platformSlug: z.enum(paymentDecisionPlatformSlugs),
    amountRange: z.enum(paymentAmountRanges),
    paymentFrequency: z.enum(paymentFrequencies),
    usageRole: z.enum(paymentUsageRoles),
    hasBackupRoute: z.boolean(),
    concerns: z.array(z.enum(paymentConcerns)),
  }),
  platform: z.object({
    slug: z.enum(paymentDecisionPlatformSlugs),
    name: z.string(),
    websiteUrl: z.string().url().nullable(),
    readinessState: z.enum(platformReadinessStates),
  }),
  recommendationCode: recommendationCodeSchema,
  recommendationTitle: z.string(),
  recommendationSummary: z.string(),
  reasons: z.array(
    z.object({
      code: z.string(),
      title: z.string(),
      detail: z.string(),
      ruleKey: z.string(),
      evidenceTitle: z.string().optional(),
    }),
  ),
  risks: z.array(
    z.object({
      category: z.enum(paymentRiskCategories),
      title: z.string(),
      relevance: z.string(),
      possibleImpact: z.string(),
      level: z.enum(["low", "medium", "high", "critical", "unknown"]),
      evidence: z.array(
        z.object({
          title: z.string(),
          excerpt: z.string(),
          sourceTitle: z.string(),
          sourceUrl: z.string().url(),
          reviewedAt: z.string().nullable(),
          publishedAt: z.string().nullable(),
          riskCategory: z.enum(paymentRiskCategories),
          confidence: z.enum(["low", "moderate", "high", "unknown"]),
        }),
      ),
    }),
  ),
  checklist: z.array(
    z.object({
      code: actionCodeSchema,
      title: z.string(),
      description: z.string(),
      category: z.enum([
        "verification",
        "records",
        "withdrawal",
        "backup",
        "support",
        "payer",
        "country",
      ]),
      applicability: z.string(),
      tradeOff: z.string().optional(),
    }),
  ),
  backupPlan: z.array(
    z.object({
      scenario: z.enum([
        "account_limitation",
        "withdrawal_delay",
        "kyc_request",
        "unavailable_payout_route",
      ]),
      title: z.string(),
      primaryAction: z.string(),
      backupAction: z.string(),
      tradeOff: z.string(),
    }),
  ),
  evidence: z.array(
    z.object({
      title: z.string(),
      excerpt: z.string(),
      sourceTitle: z.string(),
      sourceUrl: z.string().url(),
      reviewedAt: z.string().nullable(),
      publishedAt: z.string().nullable(),
      riskCategory: z.enum(paymentRiskCategories),
      confidence: z.enum(["low", "moderate", "high", "unknown"]),
    }),
  ),
  confidence: z.object({
    level: z.enum(["low", "moderate", "high"]),
    reasons: z.array(z.string()),
  }),
  limitations: z.array(z.string()),
  matchedRuleKeys: z.array(z.string()),
  generatedAt: z.string(),
  reviewedDataAt: z.string().optional(),
});
