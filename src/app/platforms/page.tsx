export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowRight, Search, ShieldAlert } from "lucide-react";
import { getPublicPlatforms } from "@/server/polibrawl/services/public-delivery.service";
import { PublicNav, PublicFooter, RiskBadge } from "@/components/public/layout";

export const metadata = {
  title: "Survival Guides | PoliBrawl",
  description:
    "Browse our directory of platform survival guides. Understand the real risks in payment, creator, and SaaS platform terms.",
  openGraph: {
    title: "Survival Guides | PoliBrawl",
    description:
      "Browse our directory of platform survival guides. Understand the real risks in payment, creator, and SaaS platform terms.",
    url: "https://polibrawl.com/platforms",
    siteName: "PoliBrawl",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Survival Guides | PoliBrawl",
    description:
      "Browse our directory of platform survival guides. Understand the real risks in payment, creator, and SaaS platform terms.",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  payment: "Payment Infrastructure",
  creator_freelance: "Creator & Freelance Tools",
  saas_developer: "SaaS & Developer APIs",
};

export default async function PlatformsDirectoryPage() {
  const platforms = await getPublicPlatforms();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicNav activePath="/platforms" />

      <main className="flex-1 py-12 mx-auto w-full max-w-6xl px-4 lg:px-6" id="main-content">
        <div className="space-y-8">
          <div className="border-b border-slate-100 pb-10 pt-4">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              Platform Survival Guides
            </h1>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl leading-relaxed">
              We translate confusing legal terms into actionable survival playbooks. Find your platform below to see its top policy risks, trigger conditions, and backup rails.
            </p>
          </div>

          {platforms.length === 0 ? (
            <div
              className="text-center py-24 bg-slate-50 border border-slate-200 rounded-xl"
              role="status"
              aria-live="polite"
            >
              <Search className="h-8 w-8 text-slate-300 mx-auto" aria-hidden="true" />
              <h2 className="mt-4 text-base font-bold text-slate-700">
                No guides published yet
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                The editorial team is working on first-coverage platforms. Check back soon.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" role="list">
              {platforms.map((platform) => (
                <Link
                  key={platform.id}
                  href={`/platforms/${platform.slug}`}
                  className="group outline-none block h-full"
                  role="listitem"
                  aria-label={`View ${platform.name} survival guide`}
                >
                  <article className="h-full flex flex-col rounded-xl border border-slate-200 bg-white p-6 transition-all hover:shadow-lg hover:border-blue-200 focus-visible:ring-2 focus-visible:ring-blue-600 relative overflow-hidden">
                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <h2 className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                        {platform.name}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2 mb-4 relative z-10">
                      <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                        {CATEGORY_LABELS[platform.category] ?? platform.category}
                      </span>
                      {platform.main_level && (
                        <>
                          <span className="text-slate-300">•</span>
                          <RiskBadge level={platform.main_level} />
                        </>
                      )}
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 flex-1 relative z-10">
                      {platform.summary ?? "Policy coverage in progress."}
                    </p>

                    <div className="mt-6 flex items-center text-sm font-bold text-blue-600 group-hover:translate-x-1 transition-transform relative z-10">
                      Open Survival Playbook
                      <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
                    </div>

                    <div className="absolute -bottom-6 -right-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                      <ShieldAlert className="w-32 h-32 text-blue-900" />
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
