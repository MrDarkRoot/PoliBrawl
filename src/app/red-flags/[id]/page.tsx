export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckSquare, FileText, Info, ShieldAlert, TriangleAlert } from "lucide-react";
import {
  getPublicRedFlag,
  getPublicEvidence,
  getPublicSurvivalNotes,
  getPublicBackupOptions,
  getPublicChecklists,
} from "@/server/polibrawl/services/public-delivery.service";
import { PublicNav, PublicFooter, PublicBreadcrumb, RiskBadge } from "@/components/public/layout";
import { queryOne } from "@/server/polibrawl/db";
import type { Platform } from "@/types/polibrawl";

// Use a minimal public-safe platform lookup (status = 'published' guard)
async function getPublishedPlatformById(id: string): Promise<Platform | null> {
  return queryOne<Platform>(
    `SELECT * FROM platforms WHERE id = $1 AND status = 'published'`,
    [id]
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  money: "Money & Payments",
  account: "Account & Access",
  kyc: "Identity Verification",
  payout: "Payouts",
  appeal: "Appeals",
  data_saas: "Data & SaaS",
  api: "API & Developer",
  legal: "Legal",
};

export async function generateMetadata({ params }: { params: { id: string } }) {
  const redFlag = await getPublicRedFlag(params.id);
  if (!redFlag) return { title: "Not Found | PoliBrawl" };
  const platform = await getPublishedPlatformById(redFlag.platform_id);
  if (!platform) return { title: "Not Found | PoliBrawl" };

  const title = `${redFlag.title} | ${platform.name} Policy Red Flag`;
  const description = redFlag.summary;
  const url = `https://polibrawl.com/red-flags/${redFlag.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "PoliBrawl", type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function PublicRedFlagPage({ params }: { params: { id: string } }) {
  const redFlag = await getPublicRedFlag(params.id);
  if (!redFlag) notFound();

  const platform = await getPublishedPlatformById(redFlag.platform_id);
  if (!platform) notFound();

  const [evidence, survivalNotes, backupOptions, checklists] = await Promise.all([
    getPublicEvidence(redFlag.id),
    getPublicSurvivalNotes(redFlag.id),
    getPublicBackupOptions(redFlag.id),
    getPublicChecklists(redFlag.id),
  ]);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Directory", item: "https://polibrawl.com/platforms" },
        { "@type": "ListItem", position: 2, name: platform.name, item: `https://polibrawl.com/platforms/${platform.slug}` },
        { "@type": "ListItem", position: 3, name: redFlag.title, item: `https://polibrawl.com/red-flags/${redFlag.id}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: redFlag.title,
      description: redFlag.summary,
      author: { "@type": "Organization", name: "PoliBrawl" },
    },
  ];

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
            { label: platform.name, href: `/platforms/${platform.slug}` },
            { label: redFlag.title },
          ]}
        />

        <div className="space-y-10">
          {/* Red flag header */}
          <header>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <RiskBadge level={redFlag.level} />
              <span className="text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded px-2 py-0.5">
                {CATEGORY_LABELS[redFlag.category] ?? redFlag.category}
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-4">
              {redFlag.title}
            </h1>
            {redFlag.summary && (
              <p className="text-lg text-slate-600 leading-relaxed max-w-3xl">
                {redFlag.summary}
              </p>
            )}
          </header>

          {/* Why it matters */}
          {redFlag.why_it_matters && (
            <section aria-labelledby="why-matters-heading">
              <h2
                id="why-matters-heading"
                className="flex items-center text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4"
              >
                <TriangleAlert className="mr-2 h-4 w-4 text-amber-400" aria-hidden="true" />
                Why it matters
              </h2>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">
                {redFlag.why_it_matters}
              </div>
            </section>
          )}

          {/* Evidence */}
          {evidence.length > 0 && (
            <section aria-labelledby="evidence-heading">
              <h2
                id="evidence-heading"
                className="flex items-center text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4"
              >
                <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
                Source Evidence
              </h2>
              <div className="grid gap-4">
                {evidence.map((ev) => (
                  <figure
                    key={ev.id}
                    className="bg-white border border-slate-200 rounded-lg overflow-hidden"
                    aria-label={`Evidence from ${ev.source_title}`}
                  >
                    <figcaption className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{ev.source_title}</span>
                      {ev.source_url && (
                        <a
                          href={ev.source_url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-blue-600 hover:underline text-xs"
                          aria-label={`Open source document from ${ev.source_title} (opens in new tab)`}
                        >
                          View source ↗
                        </a>
                      )}
                    </figcaption>
                    <div className="p-5">
                      <blockquote
                        className="border-l-4 border-slate-300 pl-4 text-sm italic text-slate-700 leading-relaxed"
                        cite={ev.source_url ?? undefined}
                      >
                        {ev.excerpt}
                      </blockquote>
                      {ev.notes && (
                        <div className="mt-4 flex items-start gap-2 bg-slate-50 rounded p-3 text-xs text-slate-500">
                          <Info className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" aria-hidden="true" />
                          <span>{ev.notes}</span>
                        </div>
                      )}
                    </div>
                  </figure>
                ))}
              </div>
            </section>
          )}

          {/* Survival Notes */}
          {survivalNotes.length > 0 && (
            <section aria-labelledby="survival-notes-heading">
              <h2
                id="survival-notes-heading"
                className="flex items-center text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4"
              >
                <ShieldAlert className="mr-2 h-4 w-4 text-blue-500" aria-hidden="true" />
                Survival Notes
              </h2>
              <div className="grid gap-4">
                {survivalNotes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-blue-50 border border-blue-100 rounded-lg p-5"
                  >
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">
                      {note.note_title}
                    </h3>
                    <div className="text-sm text-blue-800 whitespace-pre-wrap leading-relaxed">
                      {note.note_body}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Checklists */}
          {checklists.length > 0 && (
            <section aria-labelledby="checklists-heading">
              <h2
                id="checklists-heading"
                className="flex items-center text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4"
              >
                <CheckSquare className="mr-2 h-4 w-4 text-green-500" aria-hidden="true" />
                Action Checklist
              </h2>
              <div className="grid gap-6">
                {checklists.map((checklist) => (
                  <div
                    key={checklist.id}
                    className="bg-white border border-slate-200 rounded-lg p-6"
                  >
                    <h3 className="text-base font-semibold text-slate-900 mb-1">
                      {checklist.title}
                    </h3>
                    {checklist.intro && (
                      <p className="text-sm text-slate-500 mb-5">{checklist.intro}</p>
                    )}
                    <ul className="space-y-3 mt-4" role="list">
                      {checklist.items.map((item) => (
                        <li key={item.id} className="flex items-start gap-3">
                          <span
                            className="shrink-0 mt-0.5 w-4 h-4 rounded border border-slate-300 bg-white"
                            aria-hidden="true"
                            role="presentation"
                          />
                          <div>
                            <span className="text-sm text-slate-800 font-medium">
                              {item.label}
                              {item.required && (
                                <span className="text-red-500 ml-1" aria-label="required">*</span>
                              )}
                            </span>
                            {item.details && (
                              <p className="text-xs text-slate-500 mt-0.5">{item.details}</p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Backup Options */}
          {backupOptions.length > 0 && (
            <section aria-labelledby="backup-options-heading">
              <h2
                id="backup-options-heading"
                className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4"
              >
                Backup Options
              </h2>
              <div className="grid gap-4">
                {backupOptions.map((backup) => (
                  <div
                    key={backup.id}
                    className="bg-white border border-slate-200 rounded-lg p-5"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="font-medium text-slate-900 text-sm">
                        {backup.label}
                      </h3>
                      <span className="text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 shrink-0 capitalize">
                        {backup.option_type.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mb-3">{backup.summary}</p>
                    <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded border border-slate-100">
                      <span className="font-medium text-slate-600 block mb-1">Trade-offs</span>
                      {backup.tradeoffs}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Editorial footer */}
          <aside
            className="border-t border-slate-100 pt-6 text-xs text-slate-400 leading-relaxed"
            aria-label="Editorial disclaimer"
          >
            This finding was reviewed by the PoliBrawl editorial team. PoliBrawl is not affiliated
            with, endorsed by, or sponsored by {platform.name}. Content is not legal advice.{" "}
            <Link href="/about" className="underline hover:text-slate-600 transition-colors">
              Read our methodology
            </Link>
            .
          </aside>

          {/* Back link */}
          <Link
            href={`/platforms/${platform.slug}`}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            ← Back to {platform.name} survival guide
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
