import { Clock3, Radar } from "lucide-react";

import { PublicFooter, PublicNav } from "@/components/public/layout";
import { PolicyChangeCard } from "@/components/public/ui/policy-change-components";
import { getPublishedPolicyChanges } from "@/server/polibrawl/services/policy-intelligence.service";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Policy Change Radar | PoliBrawl",
  description:
    "Track published platform policy changes with operational context, affected users, and action steps.",
};

export default async function PolicyChangeRadarPage() {
  const changes = await getPublishedPolicyChanges();

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      <PublicNav activePath="/changes" />

      <main
        className="mx-auto flex-1 w-full max-w-[90rem] px-4 py-16 lg:px-8"
        id="main-content"
      >
        <section className="border-b-2 border-slate-900 pb-12">
          <div className="max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-3 text-sm font-black uppercase tracking-widest text-blue-700">
              <Radar className="h-5 w-5" />
              Policy Change Radar
            </div>
            <h1 className="text-5xl font-black tracking-tight text-slate-900 sm:text-7xl">
              Recent platform policy changes
            </h1>
            <p className="text-2xl font-medium leading-snug text-slate-600">
              Each entry explains the clause change, who may be affected, why it matters operationally, and what to do next.
            </p>
          </div>
        </section>

        <section className="pt-12">
          {changes.length === 0 ? (
            <div className="rounded-3xl border-2 border-slate-200 bg-slate-50 p-12 text-center">
              <Clock3 className="mx-auto h-12 w-12 text-slate-300" />
              <h2 className="mt-6 text-3xl font-black text-slate-900">
                No published policy change records yet
              </h2>
              <p className="mx-auto mt-4 max-w-3xl text-lg font-medium leading-relaxed text-slate-600">
                The radar will populate once editorial review publishes verified source comparisons.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {changes.map((change) => (
                <PolicyChangeCard key={change.id} change={change} />
              ))}
            </div>
          )}
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
