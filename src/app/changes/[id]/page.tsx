import Link from "next/link";
import { ArrowLeft, ArrowUpRight, FileText } from "lucide-react";
import { notFound } from "next/navigation";

import { PublicFooter, PublicNav } from "@/components/public/layout";
import {
  PolicyChangeActionList,
  PolicyChangeEvidenceCard,
  PolicyChangeImpactBadge,
} from "@/components/public/ui/policy-change-components";
import { getPublishedPolicyChangeById } from "@/server/polibrawl/services/policy-intelligence.service";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const change = await getPublishedPolicyChangeById(id);

  if (!change) {
    return { title: "Policy Change Not Found | PoliBrawl" };
  }

  return {
    title: `${change.platform_name} Policy Change | PoliBrawl`,
    description:
      change.summary ||
      `Policy change analysis for ${change.platform_name}.`,
  };
}

export default async function PolicyChangeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const change = await getPublishedPolicyChangeById(id);

  if (!change) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      <PublicNav activePath="/changes" />

      <main
        className="mx-auto flex-1 w-full max-w-[90rem] px-4 py-16 lg:px-8"
        id="main-content"
      >
        <div className="max-w-5xl">
          <Link
            className="inline-flex items-center text-sm font-bold text-slate-500 transition-colors hover:text-slate-900"
            href="/changes"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to radar
          </Link>

          <header className="mt-8 border-b-2 border-slate-900 pb-12">
            <div className="flex flex-wrap items-center gap-4">
              <PolicyChangeImpactBadge level={change.impact_level} />
              <span className="text-sm font-black uppercase tracking-widest text-slate-500">
                {change.platform_name}
              </span>
            </div>
            <h1 className="mt-6 text-5xl font-black tracking-tight text-slate-900 sm:text-6xl">
              {change.summary}
            </h1>
            <p className="mt-6 max-w-4xl text-xl font-medium leading-relaxed text-slate-600">
              Published policy changes should answer the operational question directly: what changed, who is affected, and what you need to prepare now.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                className="inline-flex items-center rounded-lg border-2 border-slate-900 px-5 py-3 text-base font-bold text-slate-900 transition-colors hover:bg-slate-100"
                href={`/platforms/${change.platform_slug}`}
              >
                Open platform guide
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </header>

          <section className="grid gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-8">
              <div className="rounded-2xl border-2 border-slate-200 bg-white p-8">
                <p className="text-sm font-black uppercase tracking-widest text-slate-500">
                  What Changed
                </p>
                <p className="mt-5 text-xl font-medium leading-relaxed text-slate-700">
                  {change.what_changed}
                </p>
              </div>

              <PolicyChangeActionList
                items={change.who_is_affected}
                title="Who Is Affected"
              />

              <div className="rounded-2xl border-2 border-slate-200 bg-white p-8">
                <p className="text-sm font-black uppercase tracking-widest text-slate-500">
                  Why It Matters
                </p>
                <p className="mt-5 text-xl font-medium leading-relaxed text-slate-700">
                  {change.why_it_matters}
                </p>
              </div>

              <PolicyChangeActionList
                items={change.what_to_do}
                title="What To Do"
              />

              <PolicyChangeEvidenceCard change={change} />
            </div>

            <aside className="space-y-6">
              <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-8">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-slate-500" />
                  <h2 className="text-2xl font-black text-slate-900">Editorial note</h2>
                </div>
                <p className="mt-4 text-base font-medium leading-relaxed text-slate-600">
                  PoliBrawl publishes change records only after editorial review of official source material. This is operational guidance, not legal advice.
                </p>
              </div>
            </aside>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
