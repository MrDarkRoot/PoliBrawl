export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getPublicPlatformBySlug,
  getPublicSurvivalPage,
  getPublicRedFlags,
  getPublicEvidence,
  getPublicSurvivalNotes,
  getPublicBackupOptions,
  getPublicChecklists,
} from "@/server/polibrawl/services/public-delivery.service";
import { PublicNav, PublicFooter } from "@/components/public/layout";
import {
  PlatformHero,
  TLDRBox,
  RiskCard,
  AffectedUsers,
  ChecklistCard,
  BackupOptionCard,
  DetailedRedFlagCard,
  EditorialCallout,
} from "@/components/public/ui/components";

const CATEGORY_LABELS: Record<string, string> = {
  payment: "Payment Platform",
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

  // Fetch all associated data for all red flags
  const redFlagsData = await Promise.all(
    redFlags.map(async (rf) => {
      const [evidence, survivalNotes, backupOptions, checklists] = await Promise.all([
        getPublicEvidence(rf.id),
        getPublicSurvivalNotes(rf.id),
        getPublicBackupOptions(rf.id),
        getPublicChecklists(rf.id),
      ]);
      return {
        ...rf,
        evidence,
        survivalNotes,
        backupOptions,
        checklists,
      };
    })
  );

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

  // Compile TL;DR points
  const tldrPoints = [];
  if (survivalPage?.survival_summary) {
    tldrPoints.push(...survivalPage.survival_summary.split('.').filter(s => s.trim().length > 10).map(s => s.trim() + '.').slice(0, 3));
  } else {
    redFlags.slice(0, 3).forEach(rf => {
      if (rf.summary) tldrPoints.push(rf.summary.split('.')[0] + '.');
    });
  }

  // Compile unified Checklists
  const allChecklists = redFlagsData.flatMap(rf => rf.checklists);
  
  // Compile unified Backup Options
  const allBackupOptions = redFlagsData.flatMap(rf => rf.backupOptions);

  // Affected Users Chips
  const affectedUsers = platform.category === 'payment' ? ['Freelancer', 'Agency', 'SaaS', 'Creator'] : ['Freelancer', 'Small Business'];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicNav />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-10" id="main-content">
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          
          {/* Sticky Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-6">
            <nav className="space-y-1 text-sm font-medium text-slate-500">
              <Link href="#overview" className="block px-3 py-2 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors">Overview</Link>
              <Link href="#top-risks" className="block px-3 py-2 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors">Top Risks</Link>
              <Link href="#survival-checklist" className="block px-3 py-2 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors">Survival Checklist</Link>
              <Link href="#backup-options" className="block px-3 py-2 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors">Backup Options</Link>
              <Link href="#detailed-flags" className="block px-3 py-2 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors">Detailed Red Flags</Link>
              <Link href="#editorial" className="block px-3 py-2 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors">Editorial Methodology</Link>
            </nav>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            
            <div id="overview">
              <PlatformHero 
                name={platform.name}
                category={CATEGORY_LABELS[platform.category] ?? platform.category}
                riskLevel={platform.main_level || "low"}
                websiteUrl={platform.website_url || ""}
                lastReviewed={survivalPage?.last_reviewed_at ? new Date(survivalPage.last_reviewed_at).toLocaleDateString() : "Pending"}
                summary={survivalPage?.summary ?? platform.summary ?? ""}
              />

              {tldrPoints.length > 0 && (
                <TLDRBox points={tldrPoints} />
              )}
            </div>

            <div id="top-risks" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-6">Top Risks</h2>
              {redFlags.length === 0 ? (
                <p className="text-slate-500 bg-slate-50 p-6 rounded-xl border border-slate-200">No red flags have been published yet.</p>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                  {redFlags.map(rf => (
                    <RiskCard 
                      key={rf.id}
                      title={rf.title}
                      severity={rf.level}
                      summary={rf.summary || ""}
                      href={`/red-flags/${rf.id}`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div id="affected-users" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-6">Who is Affected?</h2>
              <AffectedUsers types={affectedUsers} />
            </div>

            <div id="survival-checklist" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-6">Survival Checklist</h2>
              {allChecklists.length === 0 ? (
                <p className="text-slate-500 bg-slate-50 p-6 rounded-xl border border-slate-200">No checklist available.</p>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {allChecklists.map(checklist => (
                    <ChecklistCard 
                      key={checklist.id}
                      title={checklist.title}
                      items={checklist.items.map(i => ({ label: i.label, required: i.required ?? false }))}
                    />
                  ))}
                </div>
              )}
            </div>

            <div id="backup-options" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-6">Backup Options</h2>
              {allBackupOptions.length === 0 ? (
                <p className="text-slate-500 bg-slate-50 p-6 rounded-xl border border-slate-200">No backup options listed.</p>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {allBackupOptions.map(backup => (
                    <BackupOptionCard 
                      key={backup.id}
                      name={backup.label}
                      type={backup.option_type}
                      summary={backup.summary || ""}
                      tradeoffs={backup.tradeoffs || ""}
                    />
                  ))}
                </div>
              )}
            </div>

            <div id="detailed-flags" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-6">Detailed Red Flags</h2>
              <div className="space-y-8">
                {redFlagsData.map(rf => (
                  <DetailedRedFlagCard 
                    key={rf.id}
                    title={rf.title}
                    severity={rf.level}
                    summary={rf.summary || ""}
                    category={rf.category}
                    survivalNote={rf.survivalNotes[0]?.note_body}
                    evidence={rf.evidence[0] ? {
                      title: rf.evidence[0].source_title || "Official Document",
                      url: rf.evidence[0].source_url || "",
                      excerpt: rf.evidence[0].excerpt,
                      date: rf.evidence[0].reviewed_at ? new Date(rf.evidence[0].reviewed_at).toLocaleDateString() : "Recent"
                    } : undefined}
                  />
                ))}
              </div>
            </div>

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
