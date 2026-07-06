export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import {
  getPublicPlatformBySlug,
  getPublicSurvivalPage,
  getPublicRedFlags,
  getPublicEvidence,
  getPublicSurvivalNotes,
  getPublicBackupOptions,
  getPublicChecklists,
  getPublicPlatforms,
} from "@/server/polibrawl/services/public-delivery.service";
import { PublicNav, PublicFooter } from "@/components/public/layout";
import {
  SurvivalHero,
  SurvivalPriorityCallout,
  SelfIdentificationChecklist,
  RiskSnapshotGrid,
  TopRiskCard,
  SurvivalPlaybook,
  PlaybookColumn,
  TodaysActions,
  ActionItemCard,
  BackupRails,
  BackupRailCard,
  EvidenceAccordion,
  RelatedGuides,
  EditorialMethodology,
  ReadingProgressNav,
} from "@/components/public/ui/playbook-components";
import { sanitizePublicCopy } from "@/components/public/ui/copy-sanitizer";

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
    sanitizePublicCopy(platform.summary) ||
    `Policy red flags and survival guide for ${platform.name}. Understand account risk, payout restrictions, and more.`;
  const url = `https://polibrawl.com/platforms/${platform.slug}`;

  return {
    title: `${platform.name} Survival Playbook — Policy Red Flags | PoliBrawl`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${platform.name} Survival Playbook — Policy Red Flags | PoliBrawl`,
      description,
      url,
      siteName: "PoliBrawl",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${platform.name} Survival Playbook — Policy Red Flags | PoliBrawl`,
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

  const allPlatforms = await getPublicPlatforms();
  const relatedPlatforms = allPlatforms
    .filter(p => p.slug !== slug)
    .slice(0, 5)
    .map(p => ({ name: p.name, slug: p.slug }));

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

  const rawSummary = survivalPage?.survival_summary || platform.summary;
  const safeSummary = sanitizePublicCopy(rawSummary);

  const isHighRisk = redFlags.some(rf => rf.level === 'high' || rf.level === 'critical');
  const priorityCallout = isHighRisk 
    ? "High-impact policy risks detected. Review the top risks below before scaling transaction volume."
    : "Review standard terms and backup options to ensure uninterrupted operations.";

  const allChecklists = redFlagsData.flatMap(rf => rf.checklists);
  const allBackupOptions = redFlagsData.flatMap(rf => rf.backupOptions);

  const riskSnapshots = redFlags.slice(0, 4).map(rf => {
    let cardLabel = rf.category.replace(/_/g, ' ');
    if (cardLabel === 'money') cardLabel = 'Cash-Flow Risk';
    if (cardLabel === 'account') cardLabel = 'Account Access Risk';
    if (cardLabel === 'kyc') cardLabel = 'Verification Burden';
    if (cardLabel === 'appeal') cardLabel = 'Recovery Friction';

    return {
      label: cardLabel,
      level: rf.level,
      description: sanitizePublicCopy(rf.summary) || "Operational disruption possible under specific conditions."
    };
  });

  const selfIdItems = [];
  if (platform.category === 'payment') {
    selfIdItems.push(
      "You receive client payments through this platform",
      "You cannot absorb delayed withdrawals (30-90 days)",
      "You handle high-risk transactions, refunds, or international disputes",
      "This is your primary rail for managing operational cash flow"
    );
  } else {
    selfIdItems.push(
      "You run critical business operations through this platform",
      "You sell digital goods, services, or subscriptions",
      "You rely on API access for production workflows",
      "You cannot easily migrate to an alternative within 48 hours"
    );
  }

  // Pre-fill generic survival playbook if empty
  const beforeActions = redFlagsData.flatMap(rf => rf.survivalNotes).filter(sn => sn.note_title.toLowerCase().includes('before') || sn.note_title.toLowerCase().includes('prep'));
  const duringActions = redFlagsData.flatMap(rf => rf.survivalNotes).filter(sn => sn.note_title.toLowerCase().includes('during') || sn.note_title.toLowerCase().includes('review') || sn.note_title.toLowerCase().includes('limit'));
  const afterActions = redFlagsData.flatMap(rf => rf.survivalNotes).filter(sn => sn.note_title.toLowerCase().includes('after') || sn.note_title.toLowerCase().includes('recover'));

  const navLinks = [
    { id: "overview", label: "Overview" },
    { id: "top-risks", label: "Top Risks" },
    { id: "playbook", label: "Survival Playbook" },
    { id: "actions", label: "Today's Actions" },
    { id: "backup-rails", label: "Backup Rails" },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicNav />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-10" id="main-content">
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          
          <ReadingProgressNav links={navLinks} />

          <div className="flex-1 min-w-0">
            <div id="overview">
              <SurvivalHero 
                name={platform.name}
                category={CATEGORY_LABELS[platform.category] ?? platform.category}
                riskLevel={platform.main_level || "low"}
                websiteUrl={platform.website_url || ""}
                lastReviewed={survivalPage?.last_reviewed_at ? new Date(survivalPage.last_reviewed_at).toLocaleDateString() : "Pending"}
                summary={safeSummary}
              />

              <SurvivalPriorityCallout>
                If you only do one thing: <strong>{priorityCallout}</strong>
              </SurvivalPriorityCallout>

              <SelfIdentificationChecklist items={selfIdItems} />
            </div>

            <div id="top-risks" className="scroll-mt-24">
              <RiskSnapshotGrid risks={riskSnapshots} />
              
              <div className="mt-16">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-8">Detailed Risk Profiles</h2>
                {redFlags.length === 0 ? (
                  <p className="text-slate-500 bg-slate-50 p-6 rounded-xl border border-slate-200">No detailed risk profiles published yet.</p>
                ) : (
                  <div className="space-y-6">
                    {redFlagsData.map(rf => (
                      <TopRiskCard 
                        key={rf.id}
                        title={rf.title}
                        severity={rf.level}
                        impact={rf.level === 'critical' ? 'Total loss of account access or held funds.' : 'Temporary limitation on withdrawals or features.'}
                        whyItMatters={sanitizePublicCopy(rf.summary)}
                        preparation={rf.survivalNotes[0] ? sanitizePublicCopy(rf.survivalNotes[0].note_body) : 'Maintain strict compliance with acceptable use policies.'}
                        href={`/red-flags/${rf.id}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div id="playbook" className="scroll-mt-24">
              <SurvivalPlaybook>
                <PlaybookColumn phase="Before it happens" title="Preparation">
                  {beforeActions.length > 0 ? (
                    beforeActions.map(a => <p key={a.id}>{sanitizePublicCopy(a.note_body)}</p>)
                  ) : (
                    <p>Establish a secondary operational rail immediately. Ensure all Know Your Business (KYB) and Know Your Customer (KYC) documentation is verified and stored locally. Avoid holding excessive working capital in the platform balance.</p>
                  )}
                </PlaybookColumn>
                <PlaybookColumn phase="If it happens today" title="Immediate Mitigation">
                  {duringActions.length > 0 ? (
                    duringActions.map(a => <p key={a.id}>{sanitizePublicCopy(a.note_body)}</p>)
                  ) : (
                    <p>Do not create a secondary account, as this will trigger permanent bans. Respond to compliance requests with official, unmodified documentation within 24 hours. Pause automated marketing campaigns that drive traffic to this rail to limit customer friction.</p>
                  )}
                </PlaybookColumn>
                <PlaybookColumn phase="After recovery" title="Long-term Strategy">
                  {afterActions.length > 0 ? (
                    afterActions.map(a => <p key={a.id}>{sanitizePublicCopy(a.note_body)}</p>)
                  ) : (
                    <p>If recovered, slowly ramp up volume rather than processing massive backlogs at once. If permanently limited, immediately switch checkout links to your backup rail and prepare for standard funds holding periods (often up to 180 days for chargeback liability).</p>
                  )}
                </PlaybookColumn>
              </SurvivalPlaybook>
            </div>

            <div id="actions" className="scroll-mt-24">
              <TodaysActions>
                {allChecklists.length === 0 ? (
                  <ActionItemCard 
                    title="Export critical data and verify documents"
                    whyItMatters="Keeps evidence ready if your account is reviewed. Prevents frantic document hunting during an active suspension."
                    timeEstimate="15 mins"
                    priority="High"
                  />
                ) : (
                  allChecklists.flatMap(c => c.items.map(item => (
                    <ActionItemCard 
                      key={item.label}
                      title={sanitizePublicCopy(item.label)}
                      whyItMatters={item.required ? "Critical requirement based on policy triggers." : "Recommended hygienic practice for this platform."}
                      priority={item.required ? "High" : "Medium"}
                    />
                  )))
                )}
              </TodaysActions>
            </div>

            <div id="backup-rails" className="scroll-mt-24">
              <BackupRails>
                {allBackupOptions.length === 0 ? (
                  <p className="text-slate-500 bg-slate-50 p-6 rounded-xl border border-slate-200">No backup options listed.</p>
                ) : (
                  allBackupOptions.map(backup => (
                    <BackupRailCard 
                      key={backup.id}
                      title={backup.label}
                      whenToUse={sanitizePublicCopy(backup.summary) || "Use when primary platform is restricted."}
                      tradeoffs={sanitizePublicCopy(backup.tradeoffs) || "Migration effort and potential fee differences."}
                    />
                  ))
                )}
              </BackupRails>
            </div>

            <div id="evidence" className="scroll-mt-24">
              <EvidenceAccordion items={redFlagsData.flatMap(rf => rf.evidence).map(ev => ({
                title: sanitizePublicCopy(ev.source_title) || "Official Policy Document",
                url: ev.source_url || undefined,
                excerpt: sanitizePublicCopy(ev.excerpt),
                date: ev.reviewed_at ? new Date(ev.reviewed_at).toLocaleDateString() : "Recent"
              }))} />
            </div>

            <RelatedGuides platforms={relatedPlatforms} />

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
