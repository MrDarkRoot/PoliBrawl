export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink, ShieldAlert } from "lucide-react";
import {
  getPublicPlatformBySlug,
  getPublicSurvivalPage,
  getPublicRedFlags,
} from "@/server/polibrawl/services/public-delivery.service";
import { PublicNav, PublicFooter, PublicBreadcrumb, RiskBadge } from "@/components/public/layout";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  payment: "Payment",
  creator_freelance: "Creator & Freelance",
  saas_developer: "SaaS & Developer",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const platform = await getPublicPlatformBySlug(slug);
  if (!platform) return { title: "Not Found | PoliBrawl" };
  const description =
    platform.summary ??
    `Policy red flags and survival guide for ${platform.name}. Understand account risk, payout restrictions, and more.`;
  const url = `https://polibrawl.com/platforms/${platform.slug}`;

  return {
    title: `${platform.name} — Policy Red Flags & Survival Guide | PoliBrawl`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${platform.name} — Policy Red Flags & Survival Guide | PoliBrawl`,
      description,
      url,
      siteName: "PoliBrawl",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${platform.name} — Policy Red Flags & Survival Guide | PoliBrawl`,
      description,
    },
  };
}

export default async function PlatformSurvivalGuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const platform = await getPublicPlatformBySlug(slug);
  if (!platform) notFound();

  const survivalPage = await getPublicSurvivalPage(platform.id);
  const redFlags = survivalPage ? await getPublicRedFlags(survivalPage.id) : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Directory", item: "https://polibrawl.com/platforms" },
      {
        "@type": "ListItem",
        position: 2,
        name: platform.name,
        item: `https://polibrawl.com/platforms/${platform.slug}`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicNav />

      <main className="flex-1 py-10 mx-auto w-full max-w-4xl px-4 lg:px-6" id="main-content">
        <PublicBreadcrumb
          items={[
            { label: "Directory", href: "/platforms" },
            { label: platform.name },
          ]}
        />

        <div className="space-y-10">
          {/* Platform header */}
          <header>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded px-2 py-0.5">
                    {CATEGORY_LABELS[platform.category] ?? platform.category}
                  </span>
                  {platform.main_level && <RiskBadge level={platform.main_level} />}
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                  {platform.name}
                </h1>
              </div>
              {platform.website_url && (
                <a
                  href={platform.website_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  aria-label={`Visit ${platform.name} official website (opens in new tab)`}
                >
                  Official website
                  <ExternalLink className="ml-2 h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
            </div>

            {(survivalPage?.summary ?? platform.summary) && (
              <p className="mt-4 text-lg text-slate-600 leading-relaxed max-w-3xl">
                {survivalPage?.summary ?? platform.summary}
              </p>
            )}
          </header>

          {survivalPage ? (
            <div className="space-y-10">
              {/* Editorial intro */}
              {survivalPage.editorial_intro && (
                <section aria-labelledby="editorial-overview-heading">
                  <h2
                    id="editorial-overview-heading"
                    className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4"
                  >
                    Editorial Overview
                  </h2>
                  <div className="prose prose-slate max-w-none text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
                    {survivalPage.editorial_intro}
                  </div>
                </section>
              )}

              {/* Survival summary callout */}
              {survivalPage.survival_summary && (
                <section
                  className="bg-blue-50 border border-blue-100 rounded-lg p-6"
                  aria-labelledby="survival-summary-heading"
                >
                  <h2
                    id="survival-summary-heading"
                    className="text-sm font-semibold text-blue-900 flex items-center mb-3"
                  >
                    <ShieldAlert className="mr-2 h-4 w-4" aria-hidden="true" />
                    Summary
                  </h2>
                  <div className="text-sm text-blue-800 whitespace-pre-wrap leading-relaxed">
                    {survivalPage.survival_summary}
                  </div>
                </section>
              )}

              {/* Red Flags list */}
              <section aria-labelledby="red-flags-heading">
                <h2
                  id="red-flags-heading"
                  className="text-xl font-semibold text-slate-900 mb-5"
                >
                  Policy Red Flags
                </h2>

                {redFlags.length === 0 ? (
                  <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-5 py-8 text-center">
                    No red flags have been published for this platform yet.
                  </p>
                ) : (
                  <div className="grid gap-3" role="list">
                    {redFlags.map((rf) => (
                      <Link
                        key={rf.id}
                        href={`/red-flags/${rf.id}`}
                        className="group outline-none block"
                        role="listitem"
                        aria-label={`${rf.title} — ${rf.level} risk`}
                      >
                        <article className="bg-white border border-slate-200 rounded-lg p-5 transition-all hover:shadow-sm hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-slate-900">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <h3 className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                                {rf.title}
                              </h3>
                              {rf.summary && (
                                <p className="text-sm text-slate-500 line-clamp-2">
                                  {rf.summary}
                                </p>
                              )}
                            </div>
                            <div className="shrink-0 flex items-center gap-2 flex-wrap justify-end">
                              {rf.section_label && (
                                <span className="text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded px-2 py-0.5">
                                  {rf.section_label}
                                </span>
                              )}
                              <RiskBadge level={rf.level} />
                            </div>
                          </div>
                        </article>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              {/* Disclaimer */}
              {survivalPage.disclaimer_note && (
                <aside
                  className="text-xs text-slate-500 bg-slate-50 p-4 rounded border border-slate-200 whitespace-pre-wrap"
                  aria-label="Editorial disclaimer"
                >
                  <span className="font-semibold block mb-1">Disclaimer</span>
                  {survivalPage.disclaimer_note}
                </aside>
              )}
            </div>
          ) : (
            /* No survival page yet */
            <div
              className="py-16 text-center bg-slate-50 border border-slate-200 rounded-lg"
              role="status"
            >
              <ShieldAlert className="h-8 w-8 text-slate-300 mx-auto" aria-hidden="true" />
              <h2 className="mt-4 text-base font-medium text-slate-700">
                Survival guide in progress
              </h2>
              <p className="mt-2 text-sm text-slate-500 max-w-xs mx-auto">
                The editorial team is working on coverage for this platform. Check back later.
              </p>
            </div>
          )}

          {/* Independent editorial note */}
          <aside className="border-t border-slate-100 pt-6 text-xs text-slate-400 leading-relaxed">
            PoliBrawl is not affiliated with, endorsed by, or sponsored by {platform.name}. This
            content is editorially independent and does not constitute legal advice.
          </aside>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
