import Link from "next/link";

import { Button } from "@/components/ui/button";
import { submitPaymentDecisionCorrectionAction } from "@/features/payment-decision/actions/payment-decision.actions";
import { DecisionBackupPlan } from "@/features/payment-decision/components/decision-backup-plan";
import { DecisionChecklist } from "@/features/payment-decision/components/decision-checklist";
import { DecisionConfidence } from "@/features/payment-decision/components/decision-confidence";
import { DecisionRiskCard } from "@/features/payment-decision/components/decision-risk-card";
import {
  amountLabels,
  concernLabels,
  countryLabels,
  frequencyLabels,
  PaymentDecisionSummary,
  usageRoleLabels,
  workTypeLabels,
} from "@/features/payment-decision/components/payment-decision-summary";
import {
  paymentDecisionDisclaimer,
  type PaymentDecisionResult,
} from "@/features/payment-decision/types/payment-decision.types";

export function PaymentDecisionReport({
  result,
  token,
}: {
  result: PaymentDecisionResult;
  token: string;
}) {
  return (
    <div className="space-y-10">
      <section className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-6" aria-labelledby="situation-heading">
        <p className="text-sm font-black uppercase tracking-widest text-blue-700">
          Your situation
        </p>
        <h2 id="situation-heading" className="mt-2 text-3xl font-black text-slate-950">
          {workTypeLabels[result.input.workType]} evaluating {result.platform.name}
        </h2>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-slate-500">Country</dt>
            <dd className="font-black text-slate-950">{countryLabels[result.input.country]}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Amount range</dt>
            <dd className="font-black text-slate-950">{amountLabels[result.input.amountRange]}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Frequency</dt>
            <dd className="font-black text-slate-950">{frequencyLabels[result.input.paymentFrequency]}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Usage role</dt>
            <dd className="font-black text-slate-950">{usageRoleLabels[result.input.usageRole]}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm font-medium text-slate-700">
          Backup route: {result.input.hasBackupRoute ? "already exists" : "not yet verified"}.
          Concerns: {result.input.concerns.map((concern) => concernLabels[concern]).join(", ") || "none selected"}.
        </p>
      </section>

      <PaymentDecisionSummary result={result} token={token} />

      <section className="space-y-4" aria-labelledby="why-heading">
        <p className="text-sm font-black uppercase tracking-widest text-blue-700">Why</p>
        <h2 id="why-heading" className="text-3xl font-black text-slate-950">
          The rules that shaped this decision
        </h2>
        <div className="grid gap-4">
          {result.reasons.map((reason) => (
            <article key={reason.ruleKey} className="rounded-2xl border-2 border-slate-200 bg-white p-5">
              <h3 className="font-black text-slate-950">{reason.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{reason.detail}</p>
              {reason.evidenceTitle ? (
                <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Evidence: {reason.evidenceTitle}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="risks-heading">
        <p className="text-sm font-black uppercase tracking-widest text-blue-700">Main risks</p>
        <h2 id="risks-heading" className="text-3xl font-black text-slate-950">
          Evidence matched to this situation
        </h2>
        {result.risks.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {result.risks.map((risk) => (
              <DecisionRiskCard key={`${risk.category}:${risk.title}`} risk={risk} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border-2 border-slate-200 bg-white p-5 text-sm text-slate-700">
            No approved risk evidence is available for this report. The decision should remain in further review.
          </p>
        )}
      </section>

      <DecisionChecklist actions={result.checklist} />
      <DecisionBackupPlan items={result.backupPlan} />

      <section className="space-y-4" aria-labelledby="evidence-heading">
        <p className="text-sm font-black uppercase tracking-widest text-blue-700">Evidence</p>
        <h2 id="evidence-heading" className="text-3xl font-black text-slate-950">
          Public source excerpts used
        </h2>
        <div className="grid gap-4">
          {result.evidence.map((evidence) => (
            <article key={`${evidence.sourceUrl}:${evidence.title}:${evidence.riskCategory}`} className="rounded-2xl border-2 border-slate-200 bg-white p-5">
              <h3 className="font-black text-slate-950">{evidence.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{evidence.excerpt}</p>
              <a
                href={evidence.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm font-bold text-blue-700 hover:text-blue-900"
              >
                {evidence.sourceTitle}
              </a>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Reviewed: {evidence.reviewedAt ? new Date(evidence.reviewedAt).toLocaleDateString("en-US") : "Unknown"}
              </p>
            </article>
          ))}
        </div>
      </section>

      <DecisionConfidence result={result} />

      <section className="rounded-2xl border-2 border-slate-200 bg-white p-6" aria-labelledby="methodology-heading">
        <p className="text-sm font-black uppercase tracking-widest text-blue-700">
          Methodology and disclaimer
        </p>
        <h2 id="methodology-heading" className="mt-2 text-3xl font-black text-slate-950">
          Deterministic, evidence-grounded, limited
        </h2>
        <p className="mt-4 text-sm leading-6 text-slate-700">{paymentDecisionDisclaimer}</p>
        <Link href="/payment-check/methodology" className="mt-4 inline-block text-sm font-bold text-blue-700 hover:text-blue-900">
          Read methodology
        </Link>
      </section>

      <section className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-6" aria-labelledby="correction-heading">
        <p className="text-sm font-black uppercase tracking-widest text-blue-700">
          Submit a correction
        </p>
        <h2 id="correction-heading" className="mt-2 text-2xl font-black text-slate-950">
          Flag outdated or incomplete evidence
        </h2>
        <form action={submitPaymentDecisionCorrectionAction} className="mt-5 grid gap-4">
          <input type="hidden" name="platformSlug" value={result.platform.slug} />
          <input type="hidden" name="reportToken" value={token} />
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          <label className="grid gap-2 text-sm font-bold text-slate-800">
            Correction type
            <select name="issueType" required className="rounded-lg border-2 border-slate-200 bg-white px-3 py-2">
              <option value="outdated_evidence">Outdated evidence</option>
              <option value="broken_official_link">Broken official link</option>
              <option value="incorrect_country_assumption">Incorrect country assumption</option>
              <option value="missing_payout_restriction">Missing payout restriction</option>
              <option value="unclear_recommendation">Unclear recommendation</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-800">
            What should be reviewed?
            <textarea name="message" required minLength={10} maxLength={2000} className="min-h-28 rounded-lg border-2 border-slate-200 bg-white px-3 py-2" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-800">
            Official source URL, if available
            <input name="sourceUrl" type="url" className="rounded-lg border-2 border-slate-200 bg-white px-3 py-2" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-800">
            Email for follow-up, optional
            <input name="contactEmail" type="email" className="rounded-lg border-2 border-slate-200 bg-white px-3 py-2" />
          </label>
          <Button type="submit" className="w-fit">Submit for founder review</Button>
        </form>
      </section>
    </div>
  );
}
