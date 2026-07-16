import type { PaymentPlatformComparison } from "@/features/payment-decision/types/payment-decision.types";

function label(value: string) {
  return value.replace(/_/g, " ");
}

export function PlatformComparison({
  comparison,
}: {
  comparison: PaymentPlatformComparison;
}) {
  return (
    <section className="space-y-6" aria-labelledby="comparison-heading">
      <div>
        <p className="text-sm font-black uppercase tracking-widest text-blue-700">
          Two-platform comparison
        </p>
        <h1 id="comparison-heading" className="mt-3 text-5xl font-black tracking-tight text-slate-950">
          Compare primary and backup fit
        </h1>
        <p className="mt-4 max-w-3xl text-lg font-medium leading-7 text-slate-700">
          This comparison does not rank platforms universally. It compares evidence coverage for the two routes you selected.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {comparison.platforms.map((platform) => (
          <article key={platform.slug} className="rounded-2xl border-2 border-slate-200 bg-white p-5">
            <h2 className="text-2xl font-black text-slate-950">{platform.name}</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Readiness</dt>
                <dd className="font-bold text-slate-950">{label(platform.readinessState)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Confidence</dt>
                <dd className="font-bold text-slate-950">{platform.confidence}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Country coverage</dt>
                <dd className="font-bold text-slate-950">{label(platform.countryEvidenceCoverage)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Fund access risk</dt>
                <dd className="font-bold text-slate-950">{label(platform.fundAccessRisk)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Withdrawal evidence</dt>
                <dd className="font-bold text-slate-950">{label(platform.withdrawalRestrictionEvidence)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Verification</dt>
                <dd className="font-bold text-slate-950">{label(platform.verificationRequirements)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Payer compatibility</dt>
                <dd className="font-bold text-slate-950">{label(platform.payerCompatibilityLimits)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Appeal clarity</dt>
                <dd className="font-bold text-slate-950">{label(platform.appealClarity)}</dd>
              </div>
            </dl>
            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm font-medium leading-6 text-slate-700">
              {platform.backupSuitability}
            </p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border-2 border-slate-900 bg-white p-5">
          <h2 className="text-xl font-black text-slate-950">Better fit for primary use</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">{comparison.betterFitForPrimaryUse}</p>
        </article>
        <article className="rounded-2xl border-2 border-slate-900 bg-white p-5">
          <h2 className="text-xl font-black text-slate-950">Better fit for backup use</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">{comparison.betterFitForBackupUse}</p>
        </article>
      </div>

      <article className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-5">
        <h2 className="text-xl font-black text-slate-950">Unresolved trade-offs</h2>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
          {comparison.unresolvedTradeoffs.map((tradeoff) => (
            <li key={tradeoff}>{tradeoff}</li>
          ))}
        </ul>
      </article>
    </section>
  );
}
