import type { BackupPlanItem } from "@/features/payment-decision/types/payment-decision.types";

export function DecisionBackupPlan({ items }: { items: BackupPlanItem[] }) {
  return (
    <section className="space-y-4" aria-labelledby="backup-plan-heading">
      <div>
        <p className="text-sm font-black uppercase tracking-widest text-blue-700">
          Backup plan
        </p>
        <h2 id="backup-plan-heading" className="mt-2 text-3xl font-black text-slate-950">
          What to do if the route fails
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <article key={item.scenario} className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-5">
            <h3 className="text-lg font-black text-slate-950">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              <strong className="font-black text-slate-900">Primary action: </strong>
              {item.primaryAction}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              <strong className="font-black text-slate-900">Backup action: </strong>
              {item.backupAction}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              <strong className="font-black text-slate-900">Trade-off: </strong>
              {item.tradeOff}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
