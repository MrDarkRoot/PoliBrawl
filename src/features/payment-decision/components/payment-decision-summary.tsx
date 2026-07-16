import Link from "next/link";

import { DecisionCopyButton } from "@/features/payment-decision/components/decision-copy-button";
import type {
  PaymentDecisionInput,
  PaymentDecisionResult,
} from "@/features/payment-decision/types/payment-decision.types";

export const countryLabels: Record<PaymentDecisionInput["country"], string> = {
  vietnam: "Vietnam",
  country_verification_required: "Other / country verification required",
};

export const workTypeLabels: Record<PaymentDecisionInput["workType"], string> = {
  bug_bounty: "Bug bounty researcher",
  freelancer: "Freelancer",
  creator: "Creator",
  consultant: "Consultant",
  indie_hacker: "Indie hacker",
  other: "Other",
};

export const amountLabels: Record<PaymentDecisionInput["amountRange"], string> = {
  under_500: "Under $500",
  "500_to_5000": "$500 to $5,000",
  over_5000: "Over $5,000",
};

export const frequencyLabels: Record<PaymentDecisionInput["paymentFrequency"], string> = {
  one_time: "One-time",
  irregular: "Irregular",
  regular: "Regular",
};

export const usageRoleLabels: Record<PaymentDecisionInput["usageRole"], string> = {
  primary: "Primary payout route",
  backup: "Backup payout route",
  evaluating: "Evaluating",
};

export const concernLabels: Record<PaymentDecisionInput["concerns"][number], string> = {
  fund_hold: "Fund holds",
  account_limitation: "Account limitation",
  kyc: "KYC / verification",
  withdrawal: "Withdrawal",
  chargeback: "Chargeback",
  support_or_appeal: "Support or appeal",
  country_eligibility: "Country eligibility",
};

export function formatChecklistText(result: PaymentDecisionResult) {
  return result.checklist
    .map((item, index) => `${index + 1}. ${item.title}: ${item.description}`)
    .join("\n");
}

export function formatReportText(result: PaymentDecisionResult) {
  return [
    `PoliBrawl payment decision report for ${result.platform.name}`,
    "",
    `Decision: ${result.recommendationTitle}`,
    result.recommendationSummary,
    "",
    "Why:",
    ...result.reasons.map((reason) => `- ${reason.detail}`),
    "",
    "Preparation checklist:",
    formatChecklistText(result),
    "",
    "Confidence:",
    `${result.confidence.level}: ${result.confidence.reasons.join(" ")}`,
  ].join("\n");
}

export function PaymentDecisionSummary({
  result,
  token,
}: {
  result: PaymentDecisionResult;
  token?: string;
}) {
  const shareUrl = token ? `/payment-check/result/${token}` : "/payment-check";
  const absoluteShareUrl = `https://poli-brawl.vercel.app${shareUrl}`;

  return (
    <section className="grid gap-4 rounded-2xl border-2 border-slate-900 bg-white p-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] lg:grid-cols-[1.2fr_0.8fr]">
      <div>
        <p className="text-sm font-black uppercase tracking-widest text-blue-700">
          Payment dependency decision
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
          {result.recommendationTitle}
        </h1>
        <p className="mt-4 max-w-3xl text-lg font-medium leading-7 text-slate-700">
          {result.recommendationSummary}
        </p>
      </div>

      <div className="space-y-4 rounded-xl bg-slate-50 p-5">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">
            Your situation
          </p>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Country</dt>
              <dd className="font-bold text-slate-900">{countryLabels[result.input.country]}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Work</dt>
              <dd className="font-bold text-slate-900">{workTypeLabels[result.input.workType]}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Amount</dt>
              <dd className="font-bold text-slate-900">{amountLabels[result.input.amountRange]}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Role</dt>
              <dd className="font-bold text-slate-900">{usageRoleLabels[result.input.usageRole]}</dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-wrap gap-3">
          <DecisionCopyButton
            text={formatChecklistText(result)}
            label="Copy checklist"
            copiedLabel="Checklist copied"
          />
          <DecisionCopyButton
            text={absoluteShareUrl}
            label="Copy report link"
            copiedLabel="Link copied"
          />
        </div>
        <Link href="/payment-check/compare" className="text-sm font-bold text-blue-700 hover:text-blue-900">
          Start a two-platform comparison
        </Link>
      </div>
    </section>
  );
}
