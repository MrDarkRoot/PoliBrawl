import type { PaymentDecisionResult } from "@/features/payment-decision/types/payment-decision.types";

export function DecisionConfidence({ result }: { result: PaymentDecisionResult }) {
  return (
    <section className="rounded-2xl border-2 border-slate-200 bg-white p-6" aria-labelledby="confidence-heading">
      <p className="text-sm font-black uppercase tracking-widest text-blue-700">
        Confidence and limitations
      </p>
      <h2 id="confidence-heading" className="mt-2 text-3xl font-black text-slate-950">
        {result.confidence.level[0].toUpperCase()}
        {result.confidence.level.slice(1)} confidence
      </h2>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="font-black text-slate-950">Confidence reasons</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
            {result.confidence.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-black text-slate-950">Limitations</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
            {result.limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
