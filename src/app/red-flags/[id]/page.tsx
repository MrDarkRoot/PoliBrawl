export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getPublicRedFlag,
  getPublicEvidence,
  getPublicSurvivalNotes,
  getPublicBackupOptions,
  getPublicChecklists,
} from "@/server/polibrawl/services/public-delivery.service";
import { PublicNav, PublicFooter, RiskBadge } from "@/components/public/layout";
import { queryOne } from "@/server/polibrawl/db";
import type { Platform } from "@/types/polibrawl";
import {
  AffectedUsers,
  ChecklistCard,
  BackupOptionCard,
  EvidenceCard,
  EditorialCallout,
} from "@/components/public/ui/components";
import { TriangleAlert } from "lucide-react";

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

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const redFlag = await getPublicRedFlag(id);
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

export default async function PublicRedFlagPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const redFlag = await getPublicRedFlag(id);
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

  const affectedUsers = platform.category === 'payment' ? ['Freelancer', 'Agency', 'SaaS', 'Creator'] : ['Freelancer', 'Small Business'];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicNav />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-10" id="main-content">
        
        {/* Top Breadcrumb link back */}
        <Link
          href={`/platforms/${platform.slug}`}
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-10"
        >
          ← Back to {platform.name} survival guide
        </Link>

        <div className="flex flex-col lg:flex-row gap-12 items-start">
          
          {/* Sticky Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-6">
            <nav className="space-y-1 text-sm font-medium text-slate-500">
              <Link href="#overview" className="block px-3 py-2 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors">Overview</Link>
              <Link href="#impact" className="block px-3 py-2 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors">Why It Matters</Link>
              <Link href="#survival" className="block px-3 py-2 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors">How to Survive</Link>
              <Link href="#checklist" className="block px-3 py-2 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors">Checklist</Link>
              <Link href="#options" className="block px-3 py-2 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors">Alternative Options</Link>
              <Link href="#evidence" className="block px-3 py-2 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors">Source Evidence</Link>
            </nav>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            
            <div id="overview" className="mb-16 scroll-mt-24">
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <RiskBadge level={redFlag.level} />
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {CATEGORY_LABELS[redFlag.category] ?? redFlag.category}
                </span>
                <span className="text-slate-300">•</span>
                <Link href={`/platforms/${platform.slug}`} className="text-sm font-medium text-blue-600 hover:underline">
                  {platform.name}
                </Link>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
                {redFlag.title}
              </h1>
              {redFlag.summary && (
                <p className="text-xl text-slate-600 leading-relaxed max-w-3xl">
                  {redFlag.summary}
                </p>
              )}
            </div>

            {redFlag.why_it_matters && (
              <div id="impact" className="mb-16 scroll-mt-24">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-6 flex items-center">
                  Why It Matters
                </h2>
                <div className="text-lg text-slate-700 leading-relaxed">
                  {redFlag.why_it_matters}
                </div>
              </div>
            )}

            <div id="affected" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-6">Who is Affected?</h2>
              <AffectedUsers types={affectedUsers} />
            </div>

            {survivalNotes.length > 0 && (
              <div id="survival" className="mb-16 scroll-mt-24">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-6">How to Survive</h2>
                <div className="space-y-6">
                  {survivalNotes.map((note) => (
                    <div key={note.id} className="bg-blue-50/50 border border-blue-100 rounded-xl p-8">
                      <h3 className="flex items-center text-lg font-semibold text-blue-900 mb-4">
                        <TriangleAlert className="w-5 h-5 mr-2" />
                        {note.note_title}
                      </h3>
                      <div className="text-blue-900/80 leading-relaxed text-lg">
                        {note.note_body}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {checklists.length > 0 && (
              <div id="checklist" className="mb-16 scroll-mt-24">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-6">Action Checklist</h2>
                <div className="grid gap-6">
                  {checklists.map((checklist) => (
                    <ChecklistCard 
                      key={checklist.id}
                      title={checklist.title}
                      items={checklist.items.map(i => ({ label: i.label, required: i.required ?? false }))}
                    />
                  ))}
                </div>
              </div>
            )}

            {backupOptions.length > 0 && (
              <div id="options" className="mb-16 scroll-mt-24">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-6">Alternative Options</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {backupOptions.map(backup => (
                    <BackupOptionCard 
                      key={backup.id}
                      name={backup.label}
                      type={backup.option_type}
                      summary={backup.summary || ""}
                      tradeoffs={backup.tradeoffs || ""}
                    />
                  ))}
                </div>
              </div>
            )}

            {evidence.length > 0 && (
              <div id="evidence" className="mb-16 scroll-mt-24">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-6">Source Evidence</h2>
                <div className="space-y-4">
                  {evidence.map((ev) => (
                    <EvidenceCard 
                      key={ev.id}
                      sourceTitle={ev.source_title || "Official Source"}
                      sourceUrl={ev.source_url || ""}
                      excerpt={ev.excerpt}
                      date={ev.reviewed_at ? new Date(ev.reviewed_at).toLocaleDateString() : "Recent"}
                    />
                  ))}
                </div>
              </div>
            )}

            <div id="editorial" className="scroll-mt-24">
              <EditorialCallout>
                <strong>Editorial Methodology:</strong> PoliBrawl is an independent policy intelligence platform. We are not affiliated with, endorsed by, or sponsored by {platform.name}. The evidence provided is extracted directly from the platform&apos;s official terms of service and reviewed by our editorial team. This information does not constitute legal advice.
              </EditorialCallout>
            </div>

          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
