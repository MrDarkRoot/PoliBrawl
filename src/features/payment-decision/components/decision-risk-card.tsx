import type { MatchedDecisionRisk } from "@/features/payment-decision/types/payment-decision.types";

export function DecisionRiskCard({ risk }: { risk: MatchedDecisionRisk }) {
  const evidence = risk.evidence[0];

  return (
    <article className="rounded-2xl border-2 border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-black text-slate-950">{risk.title}</h3>
        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-black uppercase tracking-wide text-slate-700">
          {risk.category.replace(/_/g, " ")}
        </span>
      </div>
      <p className="mt-3 text-sm font-medium leading-6 text-slate-700">{risk.relevance}</p>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        <strong className="font-black text-slate-900">Possible impact: </strong>
        {risk.possibleImpact}
      </p>
      {evidence ? (
        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
          <p className="font-bold text-slate-950">{evidence.title}</p>
          <p className="mt-2">{evidence.excerpt}</p>
          <a
            href={evidence.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block font-bold text-blue-700 hover:text-blue-900"
          >
            {evidence.sourceTitle}
          </a>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Reviewed: {evidence.reviewedAt ? new Date(evidence.reviewedAt).toLocaleDateString("en-US") : "Unknown"}
          </p>
        </div>
      ) : null}
    </article>
  );
}
