export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getPublicRedFlag,
  getPublicEvidence,
  getPublicPlatformById,
  getPublicSurvivalNotes,
  getPublicBackupOptions,
  getPublicChecklists,
} from "@/server/polibrawl/services/public-delivery.service";
import { PublicNav, PublicFooter } from "@/components/public/layout";
import { RiskBadge } from "@/components/public/ui/risk-badge";
import type { Platform, SurvivalNote } from "@/types/polibrawl";
import {
  UncomfortableTruth,
  ExposureChecklist,
  SurvivalPlaybook,
  PlaybookPhaseCard,
  WhatToDoToday,
  TodayActionCard,
  BackupRails,
  BackupRailCard,
  EvidenceAccordion,
  EditorialMethodology,
  ReadingProgressNav
} from "@/components/public/ui/playbook-components";
import { CopyWarningButton } from "@/components/public/ui/retention-components";
import { ArrowLeft, Target, AlertTriangle, Shield } from "lucide-react";

function partitionSurvivalNotes(notes: SurvivalNote[]) {
  const buckets = {
    before: [] as SurvivalNote[],
    during: [] as SurvivalNote[],
    after: [] as SurvivalNote[],
  };
  const uncategorized: SurvivalNote[] = [];

  notes.forEach((note) => {
    const title = note.note_title.toLowerCase();

    if (title.includes("before") || title.includes("prep")) {
      buckets.before.push(note);
      return;
    }

    if (title.includes("during") || title.includes("review") || title.includes("limit")) {
      buckets.during.push(note);
      return;
    }

    if (title.includes("after") || title.includes("recover")) {
      buckets.after.push(note);
      return;
    }

    uncategorized.push(note);
  });

  for (const key of ["before", "during", "after"] as const) {
    if (buckets[key].length === 0 && uncategorized.length > 0) {
      buckets[key].push(uncategorized.shift() as SurvivalNote);
    }
  }

  return buckets;
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
  const platform = await getPublicPlatformById(redFlag.platform_id);
  if (!platform) return { title: "Not Found | PoliBrawl" };

  const title = `${redFlag.title} | ${platform.name} Survival Playbook`;
  const description = redFlag.summary || `Policy red flag regarding ${redFlag.title}.`;
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

  const platform = await getPublicPlatformById(redFlag.platform_id);
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
        { "@type": "ListItem", position: 1, name: "Survival Guides", item: "https://polibrawl.com/platforms" },
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

  const impacts = [];
  if (redFlag.level === 'critical' || redFlag.level === 'high') {
    impacts.push({ type: "Cash Flow Freeze", desc: "Funds may be locked for 90-180 days." });
    impacts.push({ type: "Account Termination", desc: "Immediate loss of platform access." });
  } else {
    impacts.push({ type: "Payout Delays", desc: "Withdrawals may be restricted pending verification." });
    impacts.push({ type: "Feature Limitation", desc: "Certain API limits or capabilities may be reduced." });
  }

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
    title: ev.source_title || "Official Policy Document",
    url: ev.source_url || undefined,
    excerpt: ev.excerpt,
    date: ev.reviewed_at ? new Date(ev.reviewed_at).toLocaleDateString() : "Recent"
  }));

  const oneTruth = `Your account operations can look completely normal until this policy triggers a ${redFlag.level} severity review event.`;

  const groupedSurvivalNotes = partitionSurvivalNotes(survivalNotes);
  const beforeActions = groupedSurvivalNotes.before;
  const duringActions = groupedSurvivalNotes.during;
  const afterActions = groupedSurvivalNotes.after;

  const navLinks = [
    { id: "overview", label: "The Risk" },
    { id: "impact", label: "Operational Impact" },
    { id: "exposure", label: "Are You Exposed?" },
    { id: "playbook", label: "Survival Playbook" },
    { id: "actions", label: "What To Do Today" },
    { id: "evidence", label: "How Do We Know?" },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicNav />

      <main className="flex-1 max-w-[90rem] mx-auto w-full px-4 lg:px-8 py-12" id="main-content">
        
        <Link
          href={`/platforms/${platform.slug}`}
          className="inline-flex items-center text-sm font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors mb-10 group"
        >
          <ArrowLeft className="w-5 h-5 mr-3 text-slate-400 group-hover:-translate-x-2 transition-transform" />
          Back to {platform.name} Playbook
        </Link>

        <div className="flex flex-col lg:flex-row gap-16 items-start">
          
          <ReadingProgressNav links={navLinks} />

          <div className="flex-1 min-w-0 max-w-4xl">
            
            <div id="overview" className="mb-20 scroll-mt-32">
              <div className="flex items-center gap-4 mb-8">
                <span className="text-sm font-black text-slate-800 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-sm">
                  {CATEGORY_LABELS[redFlag.category] ?? redFlag.category}
                </span>
                <RiskBadge level={redFlag.level} />
              </div>
              <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-slate-900 mb-8 leading-tight">
                {redFlag.title}
              </h1>
              
              <UncomfortableTruth message={oneTruth} />

              {redFlag.summary && (
                <div className="text-2xl text-slate-700 leading-relaxed font-medium mt-12 border-l-4 border-slate-300 pl-6">
                  <p>{redFlag.summary}</p>
                </div>
              )}
              
              <div className="mt-8">
                <CopyWarningButton 
                  platformName={platform.name}
                  riskTitle={redFlag.title}
                  whyItMatters={redFlag.why_it_matters || redFlag.summary}
                  url={`https://polibrawl.com/red-flags/${redFlag.id}`}
                />
              </div>
            </div>

            <div id="impact" className="mb-20 scroll-mt-32">
              <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-10 flex items-center">
                <Target className="w-10 h-10 mr-4 text-red-500" />
                Why Users Get Caught
              </h2>
              
              {redFlag.why_it_matters && (
                <div className="text-xl text-slate-700 leading-relaxed mb-12 bg-red-50 border-2 border-red-200 p-8 rounded-2xl shadow-sm">
                  <strong className="block text-sm font-black uppercase tracking-widest text-red-800 mb-3">The Trap</strong>
                  {redFlag.why_it_matters}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="bg-white border-2 border-slate-200 rounded-2xl p-8">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-3 text-amber-500" />
                    Common Triggers
                  </h3>
                  <ul className="space-y-4">
                    {triggers.map((trigger, i) => (
                      <li key={i} className="flex items-start text-lg font-medium text-slate-700">
                        <span className="w-2 h-2 rounded-full bg-amber-500 mt-2 mr-4 shrink-0" />
                        {trigger}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white border-2 border-slate-200 rounded-2xl p-8">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center">
                    <Shield className="w-5 h-5 mr-3 text-red-500" />
                    Operational Impact
                  </h3>
                  <ul className="space-y-6">
                    {impacts.map((imp, i) => (
                      <li key={i} className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center mr-4 shrink-0">
                          <span className="font-bold text-sm">!</span>
                        </div>
                        <div>
                          <strong className="block text-xl font-bold text-slate-900 mb-1">{imp.type}</strong>
                          <span className="text-lg text-slate-600 font-medium">{imp.desc}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div id="exposure" className="mb-20 scroll-mt-32">
              <ExposureChecklist items={affectedUsers.map(user => `You are a ${user} heavily dependent on this platform.`)} />
            </div>

            <div id="playbook" className="scroll-mt-32">
              <SurvivalPlaybook>
                <PlaybookPhaseCard phase="Before it happens" title="Proactive Defense">
                  {beforeActions.length > 0 ? (
                    beforeActions.map((action) => <p key={action.id}>{action.note_body}</p>)
                  ) : (
                    <p>No published preparation guidance has been assigned to this phase yet.</p>
                  )}
                </PlaybookPhaseCard>
                <PlaybookPhaseCard phase="If it hits today" title="Damage Control">
                  {duringActions.length > 0 ? (
                    duringActions.map((action) => <p key={action.id}>{action.note_body}</p>)
                  ) : (
                    <p>No published incident-response guidance has been assigned to this phase yet.</p>
                  )}
                </PlaybookPhaseCard>
                <PlaybookPhaseCard phase="After recovery" title="Post-Mortem">
                  {afterActions.length > 0 ? (
                    afterActions.map((action) => <p key={action.id}>{action.note_body}</p>)
                  ) : (
                    <p>No published recovery guidance has been assigned to this phase yet.</p>
                  )}
                </PlaybookPhaseCard>
              </SurvivalPlaybook>
            </div>

            <div id="actions" className="scroll-mt-32">
              <WhatToDoToday>
                {checklists.length === 0 ? (
                  <p className="text-xl font-medium text-slate-500 bg-slate-50 p-10 rounded-2xl border-2 border-slate-200">
                    No published checklist is available for this red flag yet.
                  </p>
                ) : (
                  checklists.flatMap(c => c.items.map(item => (
                    <TodayActionCard 
                      key={item.label}
                      title={item.label}
                      whyItMatters={item.required ? "Mandatory compliance step based on this specific policy trigger." : "Recommended operational hygiene to reduce risk."}
                      priority={item.required ? "High" : "Medium"}
                      timeEstimate="15 mins"
                    />
                  )))
                )}
              </WhatToDoToday>
            </div>

            <div id="backup-rails" className="scroll-mt-32">
              <BackupRails>
                {backupOptions.length === 0 ? (
                  <p className="text-xl font-medium text-slate-500 bg-slate-50 p-10 rounded-2xl border-2 border-slate-200">No backup rails listed.</p>
                ) : (
                  backupOptions.map(backup => (
                    <BackupRailCard 
                      key={backup.id}
                      title={backup.label}
                      whenToUse={backup.summary}
                      riskReduced="Dependency on a single payout provider."
                      tradeoffs={backup.tradeoffs}
                    />
                  ))
                )}
              </BackupRails>
            </div>

            <div id="evidence" className="scroll-mt-32">
              <EvidenceAccordion items={sanitizedEvidence} />
            </div>

            <div id="editorial" className="scroll-mt-32">
              <EditorialMethodology />
            </div>

          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
