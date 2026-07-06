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
  SurvivalPlaybook,
  PlaybookColumn,
  TodaysActions,
  ActionItemCard,
  BackupRails,
  BackupRailCard,
  EvidenceAccordion,
  EditorialMethodology,
  ReadingProgressNav
} from "@/components/public/ui/playbook-components";
import { sanitizePublicCopy } from "@/components/public/ui/copy-sanitizer";
import { AlertTriangle, ArrowRight } from "lucide-react";

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

  const title = `${redFlag.title} | ${platform.name} Survival Playbook`;
  const description = sanitizePublicCopy(redFlag.summary) || `Policy red flag regarding ${redFlag.title}.`;
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
      description: sanitizePublicCopy(redFlag.summary),
      author: { "@type": "Organization", name: "PoliBrawl" },
    },
  ];

  const affectedUsers = platform.category === 'payment' ? ['Freelancer', 'Agency', 'SaaS', 'Creator'] : ['Freelancer', 'Small Business'];

  const impacts = [];
  if (redFlag.level === 'critical' || redFlag.level === 'high') {
    impacts.push({ type: "Cash Flow Freeze", desc: "Funds may be locked for 90-180 days." });
    impacts.push({ type: "Account Termination", desc: "Immediate loss of platform access." });
  } else {
    impacts.push({ type: "Payout Delays", desc: "Withdrawals may be restricted pending verification." });
    impacts.push({ type: "Feature Limitation", desc: "Certain API limits or capabilities may be reduced." });
  }

  // Infer safe generic triggers based on category
  let triggers = [];
  switch (redFlag.category.toLowerCase()) {
    case 'money':
    case 'payment':
    case 'payout':
      triggers = [
        "Unusual transaction velocity or volume spikes",
        "Elevated dispute, chargeback, or refund ratios",
        "Cross-border payments triggering AML thresholds",
      ];
      break;
    case 'account':
    case 'kyc':
      triggers = [
        "Incomplete or expiring business verification documents (KYB/KYC)",
        "Name mismatch between platform entity and linked bank account",
        "Logins from high-risk or sanctioned IP ranges",
      ];
      break;
    default:
      triggers = [
        "Automated risk system flags behavior anomalies",
        "Violation of Acceptable Use Policy detected by internal review",
      ];
      break;
  }

  const sanitizedEvidence = evidence.map(ev => ({
    title: sanitizePublicCopy(ev.source_title) || "Official Policy Document",
    url: ev.source_url || undefined,
    excerpt: sanitizePublicCopy(ev.excerpt),
    date: ev.reviewed_at ? new Date(ev.reviewed_at).toLocaleDateString() : "Recent"
  }));

  const oneTruth = `Your account operations can look completely normal until this policy triggers a ${redFlag.level} severity review event.`;

  const beforeActions = survivalNotes.filter(sn => sn.note_title.toLowerCase().includes('before') || sn.note_title.toLowerCase().includes('prep'));
  const duringActions = survivalNotes.filter(sn => sn.note_title.toLowerCase().includes('during') || sn.note_title.toLowerCase().includes('review') || sn.note_title.toLowerCase().includes('limit'));
  const afterActions = survivalNotes.filter(sn => sn.note_title.toLowerCase().includes('after') || sn.note_title.toLowerCase().includes('recover'));

  const navLinks = [
    { id: "overview", label: "Overview" },
    { id: "impact", label: "The Risk & Impact" },
    { id: "playbook", label: "Survival Playbook" },
    { id: "actions", label: "Today's Actions" },
    { id: "backup-rails", label: "Backup Rails" },
    { id: "evidence", label: "Source Evidence" },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicNav />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-10" id="main-content">
        
        <Link
          href={`/platforms/${platform.slug}`}
          className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-10 group"
        >
          <ArrowRight className="w-4 h-4 mr-2 rotate-180 text-slate-400 group-hover:-translate-x-1 transition-transform" />
          Back to {platform.name} playbook
        </Link>

        <div className="flex flex-col lg:flex-row gap-12 items-start">
          
          <ReadingProgressNav links={navLinks} />

          <div className="flex-1 min-w-0">
            
            <div id="overview" className="mb-16 scroll-mt-24 border-b border-slate-100 pb-12">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  {CATEGORY_LABELS[redFlag.category] ?? redFlag.category}
                </span>
                <span className="text-slate-300">•</span>
                <RiskBadge level={redFlag.level} />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
                {redFlag.title}
              </h1>
              
              <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-8 my-8 shadow-lg">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" /> Uncomfortable Truth
                </h2>
                <p className="text-xl sm:text-2xl font-medium leading-snug">{oneTruth}</p>
              </div>

              {redFlag.summary && (
                <div className="text-xl text-slate-600 leading-relaxed max-w-3xl mt-8">
                  <p>{sanitizePublicCopy(redFlag.summary)}</p>
                </div>
              )}
            </div>

            <div id="impact" className="mb-16 scroll-mt-24">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-8">The Risk & Impact</h2>
              
              {redFlag.why_it_matters && (
                <div className="text-lg text-slate-700 leading-relaxed mb-10 bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <strong className="block text-sm font-bold uppercase tracking-widest text-slate-500 mb-3">Why this matters</strong>
                  {sanitizePublicCopy(redFlag.why_it_matters)}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-8 mb-10">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-4">Common Triggers</h3>
                  <ul className="space-y-3">
                    {triggers.map((trigger, i) => (
                      <li key={i} className="flex items-start text-sm text-slate-700 bg-white border border-slate-200 rounded-lg p-3">
                        <ArrowRight className="w-4 h-4 text-blue-500 mr-2 shrink-0 mt-0.5" />
                        {trigger}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-4">Operational Impact</h3>
                  <ul className="space-y-3">
                    {impacts.map((imp, i) => (
                      <li key={i} className="flex items-start p-3 border border-slate-200 rounded-lg bg-white shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 mr-3 shrink-0" />
                        <div>
                          <strong className="block text-sm text-slate-900">{imp.type}</strong>
                          <span className="text-sm text-slate-600">{imp.desc}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-10">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-4">Primary Targets</h3>
                <div className="flex flex-wrap gap-2">
                  {affectedUsers.map((type, i) => (
                    <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider border border-slate-200">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div id="playbook" className="scroll-mt-24">
              <SurvivalPlaybook>
                <PlaybookColumn phase="Before it happens" title="Proactive Defense">
                  {beforeActions.length > 0 ? (
                    beforeActions.map(a => <p key={a.id}>{sanitizePublicCopy(a.note_body)}</p>)
                  ) : (
                    <p>Maintain up-to-date incorporation documents, tax ID evidence, and supplier invoices on hand. Implement secondary processors for high-risk product cohorts to diffuse risk.</p>
                  )}
                </PlaybookColumn>
                <PlaybookColumn phase="If it hits today" title="Damage Control">
                  {duringActions.length > 0 ? (
                    duringActions.map(a => <p key={a.id}>{sanitizePublicCopy(a.note_body)}</p>)
                  ) : (
                    <p>Immediately pause customer traffic to the affected rail. Do not submit forged or altered documents under panic. Reply precisely and politely to any compliance inquiries within 24 hours.</p>
                  )}
                </PlaybookColumn>
                <PlaybookColumn phase="After recovery" title="Post-Mortem">
                  {afterActions.length > 0 ? (
                    afterActions.map(a => <p key={a.id}>{sanitizePublicCopy(a.note_body)}</p>)
                  ) : (
                    <p>Gradually increase transaction volume back to normal levels. Review the trigger event with your operations team and adjust business logic to avoid repeating the flagged behavior.</p>
                  )}
                </PlaybookColumn>
              </SurvivalPlaybook>
            </div>

            <div id="actions" className="scroll-mt-24">
              <TodaysActions>
                {checklists.length === 0 ? (
                  <ActionItemCard 
                    title="Audit your account documentation"
                    whyItMatters="Ensures that if a review is triggered, you have exactly the documents the platform expects ready to upload instantly."
                    timeEstimate="30 mins"
                    priority="High"
                  />
                ) : (
                  checklists.flatMap(c => c.items.map(item => (
                    <ActionItemCard 
                      key={item.label}
                      title={sanitizePublicCopy(item.label)}
                      whyItMatters={item.required ? "Mandatory compliance step." : "Recommended operational hygiene."}
                      priority={item.required ? "High" : "Medium"}
                    />
                  )))
                )}
              </TodaysActions>
            </div>

            <div id="backup-rails" className="scroll-mt-24">
              <BackupRails>
                {backupOptions.length === 0 ? (
                  <p className="text-slate-500 bg-slate-50 p-6 rounded-xl border border-slate-200">No backup rails listed.</p>
                ) : (
                  backupOptions.map(backup => (
                    <BackupRailCard 
                      key={backup.id}
                      title={backup.label}
                      whenToUse={sanitizePublicCopy(backup.summary) || "Use as an active fallback when this platform is down."}
                      tradeoffs={sanitizePublicCopy(backup.tradeoffs) || "Migration effort, API refactoring, and fee changes."}
                    />
                  ))
                )}
              </BackupRails>
            </div>

            <div id="evidence" className="scroll-mt-24">
              <EvidenceAccordion items={sanitizedEvidence} />
            </div>

            <div id="editorial" className="scroll-mt-24">
              <EditorialMethodology />
            </div>

          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
