import { z } from "zod";

import { isSafeHttpUrl } from "@/features/shared/schemas/http-url";
import {
  paymentAmountRanges,
  paymentConcerns,
  paymentDecisionCountries,
  paymentDecisionPlatformSlugs,
  paymentFrequencies,
  paymentUsageRoles,
  paymentWorkTypes,
} from "@/features/payment-decision/types/payment-decision.types";

const checkboxBooleanSchema = z.preprocess((value) => {
  if (value === true || value === "true" || value === "on" || value === "yes") {
    return true;
  }

  return false;
}, z.boolean());

export const paymentDecisionInputSchema = z.object({
  country: z.enum(paymentDecisionCountries),
  workType: z.enum(paymentWorkTypes),
  platformSlug: z.enum(paymentDecisionPlatformSlugs),
  amountRange: z.enum(paymentAmountRanges),
  paymentFrequency: z.enum(paymentFrequencies),
  usageRole: z.enum(paymentUsageRoles),
  hasBackupRoute: z.boolean(),
  concerns: z.array(z.enum(paymentConcerns)).max(paymentConcerns.length),
});

export const paymentDecisionFormSchema = paymentDecisionInputSchema.extend({
  hasBackupRoute: checkboxBooleanSchema,
});

export const paymentComparisonInputSchema = paymentDecisionInputSchema.extend({
  comparisonPlatformSlug: z.enum(paymentDecisionPlatformSlugs),
});

export const paymentComparisonFormSchema = paymentDecisionFormSchema.extend({
  comparisonPlatformSlug: z.enum(paymentDecisionPlatformSlugs),
});

export const paymentCorrectionFormSchema = z.object({
  platformSlug: z.enum(paymentDecisionPlatformSlugs),
  reportToken: z.string().trim().min(20).max(160).optional(),
  issueType: z.enum([
    "outdated_evidence",
    "broken_official_link",
    "incorrect_country_assumption",
    "missing_payout_restriction",
    "unclear_recommendation",
  ]),
  message: z.string().trim().min(10).max(2000),
  sourceUrl: z
    .string()
    .trim()
    .url()
    .refine(isSafeHttpUrl, "Use an http or https URL.")
    .max(500)
    .optional()
    .or(z.literal("")),
  contactEmail: z.string().trim().email().max(254).optional().or(z.literal("")),
  website: z.string().max(0).optional(),
});

export function parsePaymentDecisionFormData(formData: FormData) {
  return paymentDecisionFormSchema.parse({
    country: formData.get("country"),
    workType: formData.get("workType"),
    platformSlug: formData.get("platformSlug"),
    amountRange: formData.get("amountRange"),
    paymentFrequency: formData.get("paymentFrequency"),
    usageRole: formData.get("usageRole"),
    hasBackupRoute: formData.get("hasBackupRoute"),
    concerns: formData.getAll("concerns"),
  });
}

export function parsePaymentComparisonFormData(formData: FormData) {
  return paymentComparisonFormSchema.parse({
    ...parsePaymentDecisionFormData(formData),
    comparisonPlatformSlug: formData.get("comparisonPlatformSlug"),
  });
}

export function parsePaymentCorrectionFormData(formData: FormData) {
  return paymentCorrectionFormSchema.parse({
    platformSlug: formData.get("platformSlug"),
    reportToken: formData.get("reportToken") || undefined,
    issueType: formData.get("issueType"),
    message: formData.get("message"),
    sourceUrl: formData.get("sourceUrl") || "",
    contactEmail: formData.get("contactEmail") || "",
    website: formData.get("website") || "",
  });
}
