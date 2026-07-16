import { CheckCircle2 } from "lucide-react";

import type { DecisionAction } from "@/features/payment-decision/types/payment-decision.types";

export function DecisionChecklist({ actions }: { actions: DecisionAction[] }) {
  return (
    <section className="space-y-4" aria-labelledby="payment-checklist-heading">
      <div>
        <p className="text-sm font-black uppercase tracking-widest text-blue-700">
          Preparation checklist
        </p>
        <h2 id="payment-checklist-heading" className="mt-2 text-3xl font-black text-slate-950">
          Prepare before funds arrive
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {actions.map((action) => (
          <article key={action.code} className="rounded-2xl border-2 border-slate-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-700" aria-hidden="true" />
              <div>
                <h3 className="font-black text-slate-950">{action.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{action.description}</p>
                <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                  {action.category}
                </p>
                {action.tradeOff ? (
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    <strong className="font-black text-slate-900">Trade-off: </strong>
                    {action.tradeOff}
                  </p>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
