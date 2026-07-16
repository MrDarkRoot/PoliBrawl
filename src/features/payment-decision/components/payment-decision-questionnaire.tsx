import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createPaymentDecisionReportAction } from "@/features/payment-decision/actions/payment-decision.actions";
import {
  amountLabels,
  concernLabels,
  countryLabels,
  frequencyLabels,
  usageRoleLabels,
  workTypeLabels,
} from "@/features/payment-decision/components/payment-decision-summary";
import {
  paymentAmountRanges,
  paymentConcerns,
  paymentDecisionCountries,
  paymentFrequencies,
  paymentUsageRoles,
  paymentWorkTypes,
  type PaymentDecisionPlatformSlug,
  type PlatformReadinessState,
} from "@/features/payment-decision/types/payment-decision.types";

type PlatformOption = {
  slug: PaymentDecisionPlatformSlug;
  name: string;
  readinessState: PlatformReadinessState;
  readinessReasons: string[];
};

const readinessLabels: Record<PlatformReadinessState, string> = {
  decision_ready: "Supported",
  partial_evidence: "Partial evidence",
  country_verification_required: "Country verification required",
  not_reviewed: "Not yet reviewed",
};

const readinessStyles: Record<PlatformReadinessState, string> = {
  decision_ready: "bg-green-50 text-green-800 border-green-200",
  partial_evidence: "bg-yellow-50 text-yellow-800 border-yellow-200",
  country_verification_required: "bg-amber-50 text-amber-800 border-amber-200",
  not_reviewed: "bg-slate-100 text-slate-600 border-slate-200",
};

export function PaymentDecisionQuestionnaire({
  platformOptions,
  error,
  correction,
}: {
  platformOptions: PlatformOption[];
  error?: string;
  correction?: string;
}) {
  const selectableOptions = platformOptions.filter(
    (option) => option.readinessState !== "not_reviewed",
  );
  const defaultPlatform = selectableOptions[0]?.slug ?? "paypal";

  return (
    <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="space-y-6">
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-blue-700">
            Payment check
          </p>
          <h1 className="mt-3 text-5xl font-black tracking-tight text-slate-950">
            Check a payout platform before depending on it.
          </h1>
          <p className="mt-5 text-lg font-medium leading-7 text-slate-700">
            Answer a short, non-sensitive questionnaire. PoliBrawl will match reviewed evidence to deterministic rules and return a preparation checklist and backup plan.
          </p>
        </div>
        <ol className="grid gap-3 text-sm font-bold text-slate-700">
          {["Situation", "Platform", "Concerns", "Recommendation"].map((step, index) => (
            <li key={step} className="flex items-center gap-3 rounded-xl border-2 border-slate-200 bg-white p-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-950 text-xs text-white">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </aside>

      <section className="rounded-2xl border-2 border-slate-900 bg-white p-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
        {error ? (
          <p className="mb-5 rounded-lg border-2 border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">
            The request could not be processed: {error.replace(/_/g, " ")}.
          </p>
        ) : null}
        {correction === "submitted" ? (
          <p className="mb-5 rounded-lg border-2 border-green-200 bg-green-50 p-3 text-sm font-bold text-green-800">
            Correction submitted for founder review.
          </p>
        ) : null}

        <form action={createPaymentDecisionReportAction} className="space-y-8">
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="col-span-full text-xl font-black text-slate-950">
              1. Situation
            </legend>
            <label className="grid gap-2 text-sm font-bold text-slate-800">
              Country
              <select name="country" required defaultValue="vietnam" className="rounded-lg border-2 border-slate-200 bg-white px-3 py-2">
                {paymentDecisionCountries.map((country) => (
                  <option key={country} value={country}>
                    {countryLabels[country]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-800">
              Work type
              <select name="workType" required defaultValue="bug_bounty" className="rounded-lg border-2 border-slate-200 bg-white px-3 py-2">
                {paymentWorkTypes.map((workType) => (
                  <option key={workType} value={workType}>
                    {workTypeLabels[workType]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-800">
              Amount range
              <select name="amountRange" required defaultValue="500_to_5000" className="rounded-lg border-2 border-slate-200 bg-white px-3 py-2">
                {paymentAmountRanges.map((amountRange) => (
                  <option key={amountRange} value={amountRange}>
                    {amountLabels[amountRange]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-800">
              Payment frequency
              <select name="paymentFrequency" required defaultValue="irregular" className="rounded-lg border-2 border-slate-200 bg-white px-3 py-2">
                {paymentFrequencies.map((frequency) => (
                  <option key={frequency} value={frequency}>
                    {frequencyLabels[frequency]}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>

          <fieldset className="grid gap-4">
            <legend className="text-xl font-black text-slate-950">
              2. Platform
            </legend>
            <div className="grid gap-3 md:grid-cols-2">
              {platformOptions.map((option) => {
                const disabled = option.readinessState === "not_reviewed";

                return (
                  <label key={option.slug} className={`rounded-xl border-2 p-4 ${disabled ? "border-slate-200 bg-slate-50 text-slate-500" : "border-slate-200 bg-white text-slate-900"}`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="platformSlug"
                        value={option.slug}
                        defaultChecked={option.slug === defaultPlatform}
                        disabled={disabled}
                        className="mt-1"
                        required
                      />
                      <span>
                        <span className="block font-black">{option.name}</span>
                        <span className={`mt-2 inline-block rounded border px-2 py-0.5 text-xs font-black uppercase tracking-wide ${readinessStyles[option.readinessState]}`}>
                          {readinessLabels[option.readinessState]}
                        </span>
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="col-span-full text-xl font-black text-slate-950">
              3. Use and backup
            </legend>
            <label className="grid gap-2 text-sm font-bold text-slate-800">
              Intended usage role
              <select name="usageRole" required defaultValue="primary" className="rounded-lg border-2 border-slate-200 bg-white px-3 py-2">
                {paymentUsageRoles.map((role) => (
                  <option key={role} value={role}>
                    {usageRoleLabels[role]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-3 rounded-lg border-2 border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800">
              <input type="checkbox" name="hasBackupRoute" />
              I already have a backup payout route.
            </label>
          </fieldset>

          <fieldset className="grid gap-4">
            <legend className="text-xl font-black text-slate-950">
              4. Top concerns
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {paymentConcerns.map((concern) => (
                <label key={concern} className="flex items-center gap-3 rounded-lg border-2 border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800">
                  <input type="checkbox" name="concerns" value={concern} defaultChecked={concern === "fund_hold" || concern === "withdrawal"} />
                  {concernLabels[concern]}
                </label>
              ))}
            </div>
          </fieldset>

          <Button type="submit" size="lg" className="h-14 rounded-xl px-8 text-base font-black">
            Build decision report
            <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
          </Button>
        </form>
      </section>
    </div>
  );
}
