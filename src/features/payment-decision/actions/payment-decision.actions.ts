"use server";

import { redirect } from "next/navigation";

import {
  parsePaymentCorrectionFormData,
  parsePaymentDecisionFormData,
} from "@/features/payment-decision/schemas/payment-decision-input.schema";
import { buildPaymentDecisionReport } from "@/features/payment-decision/services/build-payment-decision-report";
import { loadPaymentRiskEvidence } from "@/features/payment-decision/services/load-payment-risk-evidence";
import { storePaymentDecisionReport } from "@/features/payment-decision/services/payment-decision-persistence";
import type { PaymentDecisionInput } from "@/features/payment-decision/types/payment-decision.types";
import { createCorrection } from "@/server/polibrawl/repositories/correction.repository";
import type { CorrectionIssueType } from "@/types/polibrawl";

const correctionIssueMap: Record<string, CorrectionIssueType> = {
  outdated_evidence: "outdated_policy",
  broken_official_link: "broken_link",
  incorrect_country_assumption: "incorrect_interpretation",
  missing_payout_restriction: "missing_evidence",
  unclear_recommendation: "incorrect_interpretation",
};

function redirectWithPaymentError(error: string): never {
  redirect(`/payment-check?error=${encodeURIComponent(error)}`);
}

export async function createPaymentDecisionReportAction(formData: FormData) {
  let input: PaymentDecisionInput;

  try {
    input = parsePaymentDecisionFormData(formData);
  } catch {
    redirectWithPaymentError("invalid_input");
  }

  const profile = await loadPaymentRiskEvidence(input.platformSlug, input.country);

  if (!profile.platform.id) {
    redirectWithPaymentError("platform_not_reviewed");
  }

  const report = buildPaymentDecisionReport(input, profile);
  const token = await storePaymentDecisionReport(input, profile, report);

  redirect(`/payment-check/result/${token}`);
}

export async function submitPaymentDecisionCorrectionAction(formData: FormData) {
  let input;

  try {
    input = parsePaymentCorrectionFormData(formData);
  } catch {
    redirect("/payment-check?correction=invalid");
  }

  const profile = await loadPaymentRiskEvidence(input.platformSlug);

  if (!profile.platform.id) {
    redirect("/payment-check?correction=platform_not_reviewed");
  }

  const issueType = correctionIssueMap[input.issueType];
  const sourceUrl = input.sourceUrl ? input.sourceUrl : null;
  const contactEmail = input.contactEmail ? input.contactEmail : null;
  const reportLine = input.reportToken ? `Report token: ${input.reportToken}` : "Report token: not provided";

  await createCorrection({
    platform_id: profile.platform.id,
    issue_type: issueType,
    message: [
      "[Payment decision correction]",
      `Payment issue: ${input.issueType}`,
      reportLine,
      "",
      input.message,
    ].join("\n"),
    source_url: sourceUrl,
    contact_email: contactEmail,
    status: "pending",
  });

  redirect(`/payment-check?correction=submitted`);
}
