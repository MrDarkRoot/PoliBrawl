export const dynamic = "force-dynamic";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PublicFooter, PublicNav } from "@/components/public/layout";
import { PlatformComparison } from "@/features/payment-decision/components/platform-comparison";
import {
  amountLabels,
  countryLabels,
  frequencyLabels,
  usageRoleLabels,
  workTypeLabels,
} from "@/features/payment-decision/components/payment-decision-summary";
import { paymentComparisonInputSchema } from "@/features/payment-decision/schemas/payment-decision-input.schema";
import { comparePaymentPlatforms } from "@/features/payment-decision/services/compare-payment-platforms";
import { listPaymentDecisionPlatformOptions } from "@/features/payment-decision/services/load-payment-risk-evidence";
import {
  paymentAmountRanges,
  paymentDecisionCountries,
  paymentFrequencies,
  paymentUsageRoles,
  paymentWorkTypes,
  type PaymentConcern,
} from "@/features/payment-decision/types/payment-decision.types";

export const metadata = {
  title: "Compare Payment Platforms | PoliBrawl",
  description:
    "Compare two payout platform routes without declaring a universal winner.",
};

type CompareSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function all(value: string | string[] | undefined) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

export default async function PaymentComparisonPage({
  searchParams,
}: {
  searchParams: Promise<CompareSearchParams>;
}) {
  const params = await searchParams;
  const platformOptions = await listPaymentDecisionPlatformOptions("vietnam");
  const hasSubmitted = Boolean(first(params.platformSlug) && first(params.comparisonPlatformSlug));
  const parsed = paymentComparisonInputSchema.safeParse({
    country: first(params.country) ?? "vietnam",
    workType: first(params.workType) ?? "bug_bounty",
    platformSlug: first(params.platformSlug) ?? "paypal",
    comparisonPlatformSlug: first(params.comparisonPlatformSlug) ?? "wise",
    amountRange: first(params.amountRange) ?? "500_to_5000",
    paymentFrequency: first(params.paymentFrequency) ?? "irregular",
    usageRole: first(params.usageRole) ?? "evaluating",
    hasBackupRoute: first(params.hasBackupRoute) === "on",
    concerns: (all(params.concerns).length > 0
      ? all(params.concerns)
      : ["fund_hold", "withdrawal"]) as PaymentConcern[],
  });
  const comparison =
    hasSubmitted && parsed.success && parsed.data.platformSlug !== parsed.data.comparisonPlatformSlug
      ? await comparePaymentPlatforms(parsed.data)
      : null;

  return (
    <div className="min-h-screen bg-white font-sans">
      <PublicNav activePath="/payment-check" />
      <main className="mx-auto grid max-w-[90rem] gap-10 px-4 py-12 lg:grid-cols-[0.8fr_1.2fr] lg:px-8" id="main-content">
        <section className="rounded-2xl border-2 border-slate-900 bg-white p-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
          <p className="text-sm font-black uppercase tracking-widest text-blue-700">
            Compare two routes
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
            No universal platform ranking.
          </h1>
          <p className="mt-4 text-sm font-medium leading-6 text-slate-700">
            Choose two reviewed platform slugs. The comparison focuses on country coverage, withdrawal evidence, verification, payer compatibility, appeal clarity, and backup suitability.
          </p>

          {hasSubmitted && (!parsed.success || first(params.platformSlug) === first(params.comparisonPlatformSlug)) ? (
            <p className="mt-5 rounded-lg border-2 border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">
              Choose two different supported platforms.
            </p>
          ) : null}

          <form method="get" className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-slate-800">
              First platform
              <select name="platformSlug" defaultValue={first(params.platformSlug) ?? "paypal"} className="rounded-lg border-2 border-slate-200 bg-white px-3 py-2">
                {platformOptions.map((option) => (
                  <option key={option.slug} value={option.slug} disabled={option.readinessState === "not_reviewed"}>
                    {option.name} - {option.readinessState.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-800">
              Second platform
              <select name="comparisonPlatformSlug" defaultValue={first(params.comparisonPlatformSlug) ?? "wise"} className="rounded-lg border-2 border-slate-200 bg-white px-3 py-2">
                {platformOptions.map((option) => (
                  <option key={option.slug} value={option.slug} disabled={option.readinessState === "not_reviewed"}>
                    {option.name} - {option.readinessState.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-800">
              Country
              <select name="country" defaultValue={first(params.country) ?? "vietnam"} className="rounded-lg border-2 border-slate-200 bg-white px-3 py-2">
                {paymentDecisionCountries.map((country) => (
                  <option key={country} value={country}>{countryLabels[country]}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-800">
              Work type
              <select name="workType" defaultValue={first(params.workType) ?? "bug_bounty"} className="rounded-lg border-2 border-slate-200 bg-white px-3 py-2">
                {paymentWorkTypes.map((workType) => (
                  <option key={workType} value={workType}>{workTypeLabels[workType]}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-800">
              Amount range
              <select name="amountRange" defaultValue={first(params.amountRange) ?? "500_to_5000"} className="rounded-lg border-2 border-slate-200 bg-white px-3 py-2">
                {paymentAmountRanges.map((amountRange) => (
                  <option key={amountRange} value={amountRange}>{amountLabels[amountRange]}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-800">
              Frequency
              <select name="paymentFrequency" defaultValue={first(params.paymentFrequency) ?? "irregular"} className="rounded-lg border-2 border-slate-200 bg-white px-3 py-2">
                {paymentFrequencies.map((frequency) => (
                  <option key={frequency} value={frequency}>{frequencyLabels[frequency]}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-800">
              Usage role
              <select name="usageRole" defaultValue={first(params.usageRole) ?? "evaluating"} className="rounded-lg border-2 border-slate-200 bg-white px-3 py-2">
                {paymentUsageRoles.map((role) => (
                  <option key={role} value={role}>{usageRoleLabels[role]}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-3 rounded-lg border-2 border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800">
              <input type="checkbox" name="hasBackupRoute" defaultChecked={first(params.hasBackupRoute) === "on"} />
              I already have one backup route.
            </label>
            <Button type="submit" className="w-fit">
              Compare selected routes
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </form>
        </section>

        <div>
          {comparison ? (
            <PlatformComparison comparison={comparison} />
          ) : (
            <section className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-6">
              <h2 className="text-3xl font-black text-slate-950">Comparison output</h2>
              <p className="mt-3 text-sm font-medium leading-6 text-slate-700">
                Submit two different supported platforms to compare evidence coverage and unresolved trade-offs.
              </p>
            </section>
          )}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
