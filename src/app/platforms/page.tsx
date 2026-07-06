export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowRight, Search, ShieldAlert, FileText } from "lucide-react";
import { getPublicPlatforms } from "@/server/polibrawl/services/public-delivery.service";
import { PublicNav, PublicFooter, RiskBadge } from "@/components/public/layout";

export const metadata = {
  title: "Survival Guides | PoliBrawl",
  description:
    "Browse our directory of platform survival guides. Understand the real risks in payment, creator, and SaaS platform terms.",
};

const CATEGORY_LABELS: Record<string, string> = {
  payment: "Payment Infrastructure",
  creator_freelance: "Creator & Freelance Tools",
  saas_developer: "SaaS & Developer APIs",
};

export default async function PlatformsDirectoryPage() {
  const platforms = await getPublicPlatforms();

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <PublicNav activePath="/platforms" />

      <main className="flex-1 py-16 mx-auto w-full max-w-[90rem] px-4 lg:px-8" id="main-content">
        <div className="space-y-16">
          <div className="border-b-2 border-slate-900 pb-12 pt-8">
            <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-slate-900 mb-6">
              Platform Survival Guides
            </h1>
            <p className="text-2xl text-slate-600 max-w-4xl leading-snug font-medium">
              We translate confusing legal terms into actionable survival playbooks. Find your platform below to see its top policy risks, trigger conditions, and backup rails.
            </p>
          </div>

          {platforms.length === 0 ? (
            <div
              className="text-center py-32 bg-slate-50 border-2 border-slate-200 rounded-3xl"
              role="status"
              aria-live="polite"
            >
              <Search className="h-12 w-12 text-slate-300 mx-auto mb-6" aria-hidden="true" />
              <h2 className="text-2xl font-black text-slate-700">
                No guides published yet
              </h2>
              <p className="mt-4 text-lg text-slate-500 font-medium">
                The editorial team is working on first-coverage platforms. Check back soon.
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3" role="list">
              {platforms.map((platform) => (
                <Link
                  key={platform.id}
                  href={`/platforms/${platform.slug}`}
                  className="group outline-none block h-full"
                  role="listitem"
                  aria-label={`View ${platform.name} survival guide`}
                >
                  <article className="h-full flex flex-col rounded-3xl border-2 border-slate-200 bg-white p-8 sm:p-10 transition-all hover:border-slate-900 hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] focus-visible:ring-4 focus-visible:ring-blue-600 relative overflow-hidden">
                    <div className="flex items-start justify-between mb-6 relative z-10">
                      <h2 className="text-4xl font-black text-slate-900 group-hover:text-blue-700 transition-colors leading-tight">
                        {platform.name}
                      </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mb-8 relative z-10">
                      <span className="text-xs font-black tracking-widest text-slate-700 uppercase bg-slate-100 px-3 py-1 rounded-md border border-slate-200">
                        {CATEGORY_LABELS[platform.category] ?? platform.category}
                      </span>
                      {platform.main_level && (
                        <RiskBadge level={platform.main_level} />
                      )}
                    </div>

                    <p className="text-lg font-medium text-slate-600 leading-relaxed line-clamp-3 flex-1 relative z-10 mb-8">
                      {platform.summary ?? "Policy coverage in progress. Review standard risks."}
                    </p>

                    <div className="flex items-center justify-between border-t-2 border-slate-100 pt-6 relative z-10">
                      <div className="flex items-center text-slate-500 font-bold text-sm">
                        <FileText className="w-5 h-5 mr-2" />
                        Playbook Available
                      </div>
                      <div className="flex items-center text-lg font-black text-blue-700 group-hover:translate-x-2 transition-transform">
                        Start survival guide
                        <ArrowRight className="ml-2 h-6 w-6" aria-hidden="true" />
                      </div>
                    </div>

                    <div className="absolute -bottom-10 -right-10 opacity-[0.02] group-hover:opacity-10 transition-opacity pointer-events-none">
                      <ShieldAlert className="w-64 h-64 text-blue-900" />
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
