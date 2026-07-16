import Link from "next/link";

import { PublicFooter, PublicNav } from "@/components/public/layout";
import { buttonVariants } from "@/components/ui/button";
import { paymentDecisionDisclaimer } from "@/features/payment-decision/types/payment-decision.types";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Payment Check Methodology | PoliBrawl",
  description:
    "How PoliBrawl builds deterministic payment dependency decision reports from reviewed public evidence.",
};

const ruleCategories = [
  "Primary payout routes need a verified secondary route before dependency is recommended.",
  "Fund hold, reserve, limitation, and withdrawal evidence creates preparation and balance-minimization actions.",
  "Medium, high, or irregular payouts require early verification and withdrawal-path checks.",
  "Country eligibility, payer compatibility, and withdrawal availability are minimum facts for a reliable decision.",
  "Weak support or appeal clarity lowers confidence and pushes users toward preserving records and backup routes.",
  "Backup-only use can be acceptable only when country support is not blocked and evidence is sufficient.",
  "Incomplete evidence produces further review rather than a high-confidence recommendation.",
];

export default function PaymentMethodologyPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <PublicNav activePath="/payment-check" />
      <main className="mx-auto max-w-5xl px-4 py-12 lg:px-8" id="main-content">
        <div className="space-y-12">
          <section className="border-b-2 border-slate-900 pb-10">
            <p className="text-sm font-black uppercase tracking-widest text-blue-700">
              Methodology
            </p>
            <h1 className="mt-3 text-5xl font-black tracking-tight text-slate-950">
              Evidence before recommendation.
            </h1>
            <p className="mt-5 text-lg font-medium leading-7 text-slate-700">
              PoliBrawl payment reports are generated from structured public evidence and deterministic rules. No external AI provider is required to produce the recommendation, checklist, backup plan, or confidence level.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-black text-slate-950">Structured evidence</h2>
            <p className="text-sm leading-6 text-slate-700">
              The workflow reads only published platform profiles, published risk records, approved evidence, active source records, safe HTTP/HTTPS source URLs, reviewed dates, and moderated public decision fields. Drafts, internal collection records, unpublished capture identifiers, operational review details, telemetry, private reviewer notes, and raw AI output are not part of the decision payload.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-black text-slate-950">Rule categories</h2>
            <ul className="grid gap-3 text-sm leading-6 text-slate-700">
              {ruleCategories.map((rule) => (
                <li key={rule} className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
                  {rule}
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border-2 border-slate-200 bg-white p-5">
              <h2 className="text-xl font-black text-slate-950">High confidence</h2>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Multiple relevant official source records, recent reviewed dates, country/payer/withdrawal support, and documented appeal routes are present.
              </p>
            </article>
            <article className="rounded-2xl border-2 border-slate-200 bg-white p-5">
              <h2 className="text-xl font-black text-slate-950">Moderate confidence</h2>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Core evidence is present, but one or more facts require confirmation before primary dependency.
              </p>
            </article>
            <article className="rounded-2xl border-2 border-slate-200 bg-white p-5">
              <h2 className="text-xl font-black text-slate-950">Low confidence</h2>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Country eligibility, payer compatibility, withdrawal availability, reviewed dates, or evidence coverage is incomplete.
              </p>
            </article>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-black text-slate-950">Limitations</h2>
            <p className="text-sm leading-6 text-slate-700">
              Reviewed public evidence cannot predict account-specific platform decisions. The workflow avoids exact income, identity documents, bank details, sensitive narratives, and user identity. Country availability and payer support should be verified with official platform and payer channels before funds are routed.
            </p>
            <p className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-800">
              {paymentDecisionDisclaimer}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-black text-slate-950">Corrections process</h2>
            <p className="text-sm leading-6 text-slate-700">
              Users can submit corrections for outdated evidence, broken official links, incorrect country assumptions, missing payout restrictions, or unclear recommendations. Corrections are stored as pending internal review items and are not published directly.
            </p>
            <Link href="/payment-check" className={cn(buttonVariants({ size: "lg" }), "rounded-xl font-black")}>
              Start a payment check
            </Link>
          </section>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
