export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { getPublicPlatforms } from "@/server/polibrawl/services/public-delivery.service";
import { PublicNav, PublicFooter, RiskBadge } from "@/components/public/layout";

export const metadata = {
  title: "Platform Directory | PoliBrawl",
  description:
    "Browse platforms analyzed for policy red flags. Covers payment processors, creator platforms, and SaaS services.",
  openGraph: {
    title: "Platform Directory | PoliBrawl",
    description:
      "Browse platforms analyzed for policy red flags. Covers payment processors, creator platforms, and SaaS services.",
    url: "https://polibrawl.com/platforms",
    siteName: "PoliBrawl",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Platform Directory | PoliBrawl",
    description:
      "Browse platforms analyzed for policy red flags. Covers payment processors, creator platforms, and SaaS services.",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  payment: "Payment",
  creator_freelance: "Creator & Freelance",
  saas_developer: "SaaS & Developer",
};

export default async function PlatformsDirectoryPage() {
  const platforms = await getPublicPlatforms();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicNav activePath="/platforms" />

      <main className="flex-1 py-12 mx-auto w-full max-w-6xl px-4 lg:px-6" id="main-content">
        <div className="space-y-8">
          <div className="border-b border-slate-100 pb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Platform Directory
            </h1>
            <p className="mt-2 text-slate-500 max-w-2xl">
              Platforms analyzed for policy risks, account restrictions, and payout terms.
              Coverage is based on publicly available legal and policy documents.
            </p>
          </div>

          {platforms.length === 0 ? (
            <div
              className="text-center py-24 bg-slate-50 border border-slate-200 rounded-lg"
              role="status"
              aria-live="polite"
            >
              <Search className="h-8 w-8 text-slate-300 mx-auto" aria-hidden="true" />
              <h2 className="mt-4 text-base font-medium text-slate-700">
                No platforms published yet
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                The editorial team is working on first-coverage platforms. Check back soon.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" role="list">
              {platforms.map((platform) => (
                <Link
                  key={platform.id}
                  href={`/platforms/${platform.slug}`}
                  className="group outline-none block"
                  role="listitem"
                  aria-label={`View ${platform.name} survival guide`}
                >
                  <article className="h-full flex flex-col rounded-lg border border-slate-200 bg-white p-6 transition-all hover:shadow-md hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-slate-900">
                    <div className="flex items-start justify-between mb-3">
                      <h2 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                        {platform.name}
                      </h2>
                      <span className="ml-3 shrink-0 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded px-2 py-0.5">
                        {CATEGORY_LABELS[platform.category] ?? platform.category}
                      </span>
                    </div>

                    {platform.main_level && (
                      <div className="mb-3">
                        <RiskBadge level={platform.main_level} />
                      </div>
                    )}

                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 flex-1">
                      {platform.summary ?? "Policy coverage in progress."}
                    </p>

                    <div className="mt-5 flex items-center text-xs font-medium text-blue-600 group-hover:translate-x-0.5 transition-transform">
                      View survival guide
                      <ArrowRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
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
