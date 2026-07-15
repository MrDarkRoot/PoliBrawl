import {
  ArrowUpRight,
  BadgeAlert,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  ShieldCheck,
  TimerReset,
} from "lucide-react";

import type {
  DependencyScore,
  EvidenceConfidence,
  ResolutionRoute,
  RiskTimeline,
} from "@/types/polibrawl";
import { cn } from "@/lib/utils";

function scoreTone(score: number) {
  if (score >= 80) {
    return "bg-red-50 text-red-800 border-red-200";
  }

  if (score >= 60) {
    return "bg-amber-50 text-amber-800 border-amber-200";
  }

  return "bg-emerald-50 text-emerald-800 border-emerald-200";
}

function confidenceLabel(score: number) {
  if (score >= 75) {
    return "High confidence";
  }

  if (score >= 50) {
    return "Medium confidence";
  }

  return "Low confidence";
}

export function DependencySnapshotCard({
  score,
  recommendation,
}: {
  score: DependencyScore | null;
  recommendation: string;
}) {
  if (!score) {
    return (
      <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-8">
        <h3 className="text-2xl font-black text-slate-900">Dependency Snapshot</h3>
        <p className="mt-4 text-lg font-medium text-slate-600">
          No published operational dependency estimate is available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-slate-900 bg-white p-8 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-slate-500">
            PoliBrawl operational dependency estimate
          </p>
          <h3 className="mt-3 text-3xl font-black text-slate-900">Your dependency risk</h3>
          <div className="mt-5 flex items-end gap-4">
            <span className="text-6xl font-black tracking-tight text-slate-900">{score.score}</span>
            <span className="pb-2 text-lg font-bold text-slate-500">/100</span>
          </div>
        </div>

        <span className={cn("rounded-full border px-4 py-2 text-sm font-black uppercase tracking-widest", scoreTone(score.score))}>
          {score.risk_level}
        </span>
      </div>

      <p className="mt-6 text-lg font-medium leading-relaxed text-slate-700">{score.explanation}</p>

      {score.factors.length > 0 ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {score.factors.map((factor, index) => (
            <div key={`${factor}-${index}`} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
              <span className="text-base font-semibold text-slate-700">{factor}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
        <p className="text-sm font-black uppercase tracking-widest text-blue-700">Recommended</p>
        <p className="mt-2 text-lg font-semibold text-blue-950">{recommendation}</p>
      </div>
    </div>
  );
}

export function WhatHappensTimeline({
  timelines,
}: {
  timelines: RiskTimeline[];
}) {
  if (timelines.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-8">
        <h3 className="text-2xl font-black text-slate-900">What happens next?</h3>
        <p className="mt-4 text-lg font-medium text-slate-600">
          Timeline varies depending on account circumstances.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {timelines.map((timeline) => (
        <div key={timeline.id} className="rounded-2xl border-2 border-slate-200 bg-white p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <TimerReset className="h-6 w-6 text-slate-700" />
            </div>
            <div className="min-w-0">
              <h3 className="text-2xl font-black text-slate-900">{timeline.title}</h3>
              <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-slate-500">
                Verified sequence based on official materials
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            {timeline.events.map((event, index) => (
              <div key={`${timeline.id}-${index}`} className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
                <div className="text-sm font-black uppercase tracking-widest text-slate-500">{event.label}</div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-lg font-medium text-slate-700">
                  {event.detail}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-600">
            <span className="font-black uppercase tracking-widest text-slate-500">Source</span>
            <p className="mt-2 leading-6">{timeline.source}</p>
            <p className="mt-3 leading-6">
              Exact timing varies depending on account circumstances and the platform&apos;s review process.
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function routeTone(type: string) {
  if (type.toLowerCase().includes("internal")) {
    return "bg-slate-100 text-slate-700";
  }

  if (type.toLowerCase().includes("regulator") || type.toLowerCase().includes("ombudsman")) {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-emerald-50 text-emerald-700";
}

export function ResolutionRoutesList({
  routes,
}: {
  routes: ResolutionRoute[];
}) {
  if (routes.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-8">
        <h3 className="text-2xl font-black text-slate-900">Where To Escalate</h3>
        <p className="mt-4 text-lg font-medium text-slate-600">
          No published escalation routes are available yet. Review the official support process first.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {routes.map((route) => (
        <div key={route.id} className="rounded-2xl border-2 border-slate-200 bg-white p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest", routeTone(route.organization_type))}>
                {route.organization_type}
              </span>
              <h3 className="mt-4 text-3xl font-black text-slate-900">{route.organization_name}</h3>
              <p className="mt-2 text-base font-medium text-slate-600">
                {(route.jurisdiction || route.country) ? [route.jurisdiction, route.country].filter(Boolean).join(" • ") : "Official route"}
              </p>
            </div>

            <a
              className="inline-flex items-center rounded-lg border-2 border-slate-900 px-4 py-2 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-50"
              href={route.official_url}
              rel="noreferrer noopener"
              target="_blank"
            >
              View official process
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-slate-500" />
                <p className="text-sm font-black uppercase tracking-widest text-slate-500">Who may use it</p>
              </div>
              {route.eligible_users.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {route.eligible_users.map((user, index) => (
                    <li key={`${route.id}-user-${index}`} className="text-base font-medium text-slate-700">
                      {user}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-base font-medium text-slate-600">Eligibility depends on the official route.</p>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <BadgeAlert className="h-5 w-5 text-slate-500" />
                <p className="text-sm font-black uppercase tracking-widest text-slate-500">Disputes covered</p>
              </div>
              {route.eligible_disputes.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {route.eligible_disputes.map((item, index) => (
                    <li key={`${route.id}-dispute-${index}`} className="text-base font-medium text-slate-700">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-base font-medium text-slate-600">Scope depends on the official route.</p>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="rounded-xl border border-slate-200 p-5">
              <p className="text-sm font-black uppercase tracking-widest text-slate-500">Prepare</p>
              {route.requirements.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {route.requirements.map((item, index) => (
                    <li key={`${route.id}-requirement-${index}`} className="flex items-start gap-3 text-base font-medium text-slate-700">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-base font-medium text-slate-600">Check the official requirements before starting.</p>
              )}

              {route.steps.length > 0 ? (
                <>
                  <p className="mt-6 text-sm font-black uppercase tracking-widest text-slate-500">Process</p>
                  <ol className="mt-4 space-y-3">
                    {route.steps.map((step, index) => (
                      <li key={`${route.id}-step-${index}`} className="flex items-start gap-3 text-base font-medium text-slate-700">
                        <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </>
              ) : null}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-black uppercase tracking-widest text-slate-500">Route details</p>
              <div className="mt-4 space-y-4 text-sm font-medium text-slate-700">
                <div>
                  <span className="block text-xs font-black uppercase tracking-widest text-slate-500">Fees</span>
                  <p className="mt-1">{route.fees || "Check official route"}</p>
                </div>
                <div>
                  <span className="block text-xs font-black uppercase tracking-widest text-slate-500">Limits</span>
                  <p className="mt-1">{route.limits || "Check official route"}</p>
                </div>
                <div>
                  <span className="block text-xs font-black uppercase tracking-widest text-slate-500">Deadline</span>
                  <p className="mt-1">{route.deadline || "Check official route"}</p>
                </div>
                <div>
                  <span className="block text-xs font-black uppercase tracking-widest text-slate-500">Last verified</span>
                  <p className="mt-1">
                    {route.last_verified_at ? new Date(route.last_verified_at).toLocaleDateString() : "Pending"}
                  </p>
                </div>
                <div>
                  <span className="block text-xs font-black uppercase tracking-widest text-slate-500">Verification source</span>
                  <p className="mt-1 leading-6">{route.verification_source}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm font-medium text-blue-950">
            <ArrowUpRight className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
            <p>This may be an available escalation route. It is not a guarantee of recovery or outcome.</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function EvidenceConfidenceCard({
  confidence,
}: {
  confidence: EvidenceConfidence | null;
}) {
  if (!confidence) {
    return (
      <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-8">
        <h3 className="text-2xl font-black text-slate-900">Confidence level</h3>
        <p className="mt-4 text-lg font-medium text-slate-600">
          No public confidence record has been published yet.
        </p>
      </div>
    );
  }

  const level = confidenceLabel(confidence.score);

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-slate-500">Confidence level</p>
          <h3 className="mt-3 text-3xl font-black text-slate-900">{level}</h3>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black uppercase tracking-widest text-slate-700">
          {confidence.score}/100
        </div>
      </div>

      {confidence.factors.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {confidence.factors.map((factor, index) => (
            <div key={`${factor}-${index}`} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
              <span className="text-base font-medium text-slate-700">{factor}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-6 flex items-center gap-3 text-sm font-medium text-slate-600">
        <Clock3 className="h-4 w-4 text-slate-500" />
        <span>
          Last verified {confidence.last_verified_at ? new Date(confidence.last_verified_at).toLocaleDateString() : "recently"}
        </span>
      </div>
    </div>
  );
}
