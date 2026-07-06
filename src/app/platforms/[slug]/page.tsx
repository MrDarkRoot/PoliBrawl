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
  SurvivalGuideHero,
  SurvivalPriorityBlock,
  ExposureChecklist,
  RiskMeterGrid,
  TopThingsThatCanGoWrong,
  StoryRiskCard,
  SurvivalPlaybook,
  PlaybookPhaseCard,
  WhatToDoToday,
  TodayActionCard,
  BackupRails,
  BackupRailCard,
  EvidenceAccordion,
  NextSurvivalGuides,
  EditorialMethodology,
  ReadingProgressNav,
} from "@/components/public/ui/playbook-components";
import { sanitizePublicCopy } from "@/components/public/ui/copy-sanitizer";
import { 
  PlatformDNA, 
  RelatedGuidesLoop, 
  RiskConceptLinks, 
  PolicyFreshnessBlock, 
  CopyWarningButton 
} from "@/components/public/ui/retention-components";

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
    sanitizePublicCopy(platform.summary, 'summary') ||
    `Survival guide for ${platform.name}. Understand account risk, payout restrictions, and more.`;
  const url = `https://polibrawl.com/platforms/${platform.slug}`;

  return {
    title: `${platform.name} Survival Playbook — PoliBrawl`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${platform.name} Survival Playbook — PoliBrawl`,
      description,
      url,
      siteName: "PoliBrawl",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${platform.name} Survival Playbook — PoliBrawl`,
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
    .slice(0, 6)
    .map(p => ({ 
      name: p.name, 
      slug: p.slug, 
      riskLevel: p.main_level || 'low', 
      category: p.category 
    }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Survival Guides", item: "https://polibrawl.com/platforms" },
      {
        "@type": "ListItem",
        position: 2,
        name: platform.name,
        item: `https://polibrawl.com/platforms/${platform.slug}`,
      },
    ],
  };

  const rawSummary = survivalPage?.survival_summary || platform.summary;
  const safeSummary = sanitizePublicCopy(rawSummary, 'summary');

  const isHighRisk = redFlags.some(rf => rf.level === 'high' || rf.level === 'critical');
  
  const priorityHeading = "If you only do one thing";
  const priorityMessage = isHighRisk 
    ? "Keep a second payout rail ready before you need it."
    : "Review standard terms and backup options to ensure uninterrupted operations.";
  const prioritySubtext = isHighRisk
    ? "The worst time to create a backup payment route is after your primary account is already limited."
    : "Operational continuity requires knowing the rules of the platforms you depend on.";

  let uncomfortableTruth = `Your operations on ${platform.name} may be interrupted without warning if internal risk thresholds are met.`;
  if (platform.category === 'payment') {
    uncomfortableTruth = `Your account can look normal until a review suddenly makes funds unavailable.`;
  }

  const allChecklists = redFlagsData.flatMap(rf => rf.checklists);
  const allBackupOptions = redFlagsData.flatMap(rf => rf.backupOptions);

  const riskSnapshots = [
    { label: "Cash-Flow Risk", level: "Low", description: "Default risk level." },
    { label: "Account Access Risk", level: "Low", description: "Default risk level." },
    { label: "Verification Burden", level: "Low", description: "Default risk level." },
    { label: "Recovery Friction", level: "Low", description: "Default risk level." },
  ];

  redFlags.forEach(rf => {
    let targetIndex = -1;
    if (rf.category === 'money' || (rf.category as string) === 'payment') targetIndex = 0;
    if (rf.category === 'account') targetIndex = 1;
    if (rf.category === 'kyc') targetIndex = 2;
    if (rf.category === 'appeal' || (rf.category as string) === 'recovery') targetIndex = 3;

    if (targetIndex !== -1) {
      const currentScore = riskSnapshots[targetIndex].level === 'critical' ? 10 : riskSnapshots[targetIndex].level === 'high' ? 8 : riskSnapshots[targetIndex].level === 'medium' ? 5 : 2;
      const newScore = rf.level === 'critical' ? 10 : rf.level === 'high' ? 8 : rf.level === 'medium' ? 5 : 2;
      if (newScore > currentScore) {
        riskSnapshots[targetIndex].level = rf.level;
        riskSnapshots[targetIndex].description = sanitizePublicCopy(rf.summary, 'summary') || "Operational disruption possible under specific conditions.";
      }
    }
  });

  const selfIdItems = [];
  if (platform.category === 'payment') {
    selfIdItems.push(
      "This platform is your main income rail",
      "You receive client or customer payments here",
      "You sell services, digital goods, or subscriptions",
      "You handle refunds, disputes, or chargebacks",
      "You cannot absorb delayed withdrawals (30-90 days)"
    );
  } else {
    selfIdItems.push(
      "You run critical business operations through this platform",
      "Your core product relies on this API or service",
      "You have a large amount of customer data stored here",
      "You cannot easily migrate to an alternative within 48 hours"
    );
  }

  const beforeActions = redFlagsData.flatMap(rf => rf.survivalNotes).filter(sn => sn.note_title.toLowerCase().includes('before') || sn.note_title.toLowerCase().includes('prep'));
  const duringActions = redFlagsData.flatMap(rf => rf.survivalNotes).filter(sn => sn.note_title.toLowerCase().includes('during') || sn.note_title.toLowerCase().includes('review') || sn.note_title.toLowerCase().includes('limit'));
  const afterActions = redFlagsData.flatMap(rf => rf.survivalNotes).filter(sn => sn.note_title.toLowerCase().includes('after') || sn.note_title.toLowerCase().includes('recover'));

  const navLinks = [
    { id: "overview", label: "Survival Overview" },
    { id: "exposure", label: "Are You Exposed?" },
    { id: "risks", label: "Top Risks" },
    { id: "playbook", label: "Survival Playbook" },
    { id: "actions", label: "What To Do Today" },
    { id: "backup-rails", label: "Backup Rails" },
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
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          
          <ReadingProgressNav links={navLinks} />

          <div className="flex-1 min-w-0 max-w-5xl">
            <div id="overview">
              <SurvivalGuideHero 
                name={platform.name}
                category={CATEGORY_LABELS[platform.category] ?? platform.category}
                riskLevel={platform.main_level || "low"}
                websiteUrl={platform.website_url || ""}
                lastReviewed={survivalPage?.last_reviewed_at ? new Date(survivalPage.last_reviewed_at).toLocaleDateString() : "Pending"}
                uncomfortableTruth={uncomfortableTruth}
                summary={safeSummary}
              />

              <SurvivalPriorityBlock 
                heading={priorityHeading}
                message={priorityMessage}
                subtext={prioritySubtext}
              />
              
              <PlatformDNA redFlags={redFlags} />
            </div>

            <div id="exposure" className="scroll-mt-32">
              <ExposureChecklist items={selfIdItems} />
            </div>

            <div id="risks" className="scroll-mt-32">
              <RiskMeterGrid risks={riskSnapshots} />
              
              <TopThingsThatCanGoWrong>
                {redFlags.length === 0 ? (
                  <p className="text-xl font-medium text-slate-500 bg-slate-50 p-10 rounded-2xl border-2 border-slate-200">No detailed risk profiles published yet.</p>
                ) : (
                  redFlagsData.map(rf => {
                    const whatCanHappen = rf.level === 'critical' ? 'Funds may become unavailable or account access immediately revoked without prior warning.' : 'Certain features or withdrawals may be temporarily paused pending review.';
                    const whyItHurts = rf.level === 'critical' ? 'You may still owe refunds, contractors, shipping costs, or customer support while your cash flow is locked.' : 'Operational friction increases, demanding significant documentation effort.';
                    return (
                      <div key={rf.id} className="relative">
                        <StoryRiskCard 
                          title={rf.title}
                          severity={rf.level}
                          uncomfortableTruth={sanitizePublicCopy(rf.summary, 'hero')}
                          whatCanHappen={whatCanHappen}
                          whyItHurts={whyItHurts}
                          prepareNow={rf.survivalNotes[0] ? sanitizePublicCopy(rf.survivalNotes[0].note_body, 'action') : 'Maintain strict compliance with acceptable use policies.'}
                          href={`/red-flags/${rf.id}`}
                        />
                        <div className="mt-2 text-right">
                          <CopyWarningButton 
                            platformName={platform.name}
                            riskTitle={rf.title}
                            whyItMatters={whyItHurts}
                            url={`https://polibrawl.com/red-flags/${rf.id}`}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </TopThingsThatCanGoWrong>
            </div>

            <div id="playbook" className="scroll-mt-32">
              <SurvivalPlaybook>
                <PlaybookPhaseCard phase="Before anything happens" title="Prepare Now">
                  {beforeActions.length > 0 ? (
                    beforeActions.map(a => <p key={a.id}>{sanitizePublicCopy(a.note_body, 'action')}</p>)
                  ) : (
                    <>
                      <p>Prepare your business formation documents, ownership evidence, and supplier invoices.</p>
                      <p>Export your transaction records regularly.</p>
                      <p>Set up a backup payout rail for high-risk cohorts.</p>
                    </>
                  )}
                </PlaybookPhaseCard>
                <PlaybookPhaseCard phase="If it happens today" title="Mitigate Damage">
                  {duringActions.length > 0 ? (
                    duringActions.map(a => <p key={a.id}>{sanitizePublicCopy(a.note_body, 'action')}</p>)
                  ) : (
                    <>
                      <p>Respond through official compliance channels with exact, unmodified PDF documents.</p>
                      <p>Preserve all customer communication regarding disputes.</p>
                      <p>Do NOT create a duplicate account to circumvent a ban.</p>
                    </>
                  )}
                </PlaybookPhaseCard>
                <PlaybookPhaseCard phase="After recovery" title="Reduce Dependency">
                  {afterActions.length > 0 ? (
                    afterActions.map(a => <p key={a.id}>{sanitizePublicCopy(a.note_body, 'action')}</p>)
                  ) : (
                    <>
                      <p>Reduce your overall dependency on this single platform.</p>
                      <p>Schedule regular data exports.</p>
                      <p>Keep your backup payout method active with a small percentage of your traffic.</p>
                    </>
                  )}
                </PlaybookPhaseCard>
              </SurvivalPlaybook>
            </div>

            <div id="actions" className="scroll-mt-32">
              <WhatToDoToday>
                {allChecklists.length === 0 ? (
                  <TodayActionCard 
                    title="Export transaction records"
                    whyItMatters="Keeps evidence ready if your account is reviewed. Prevents frantic document hunting during an active suspension."
                    timeEstimate="5-10 min"
                    priority="High"
                  />
                ) : (
                  allChecklists.flatMap(c => c.items.map(item => (
                    <TodayActionCard 
                      key={item.label}
                      title={sanitizePublicCopy(item.label, 'action')}
                      whyItMatters={item.required ? "Critical requirement based on official policy triggers." : "Recommended operational hygiene."}
                      priority={item.required ? "High" : "Medium"}
                      timeEstimate="10-15 min"
                    />
                  )))
                )}
              </WhatToDoToday>
            </div>

            <div id="backup-rails" className="scroll-mt-32">
              <BackupRails>
                {allBackupOptions.length === 0 ? (
                  <p className="text-xl font-medium text-slate-500 bg-slate-50 p-10 rounded-2xl border-2 border-slate-200">No backup rails listed yet.</p>
                ) : (
                  allBackupOptions.map(backup => (
                    <BackupRailCard 
                      key={backup.id}
                      title={backup.label}
                      whenToUse={sanitizePublicCopy(backup.summary, 'action') || "Before your primary payout rail is restricted."}
                      riskReduced="Single-platform operational dependency."
                      tradeoffs={sanitizePublicCopy(backup.tradeoffs, 'action') || "Setup time, implementation complexity, and varied fees."}
                    />
                  ))
                )}
              </BackupRails>
            </div>

            <div id="evidence" className="scroll-mt-32">
              <EvidenceAccordion items={redFlagsData.flatMap(rf => rf.evidence).map(ev => ({
                title: sanitizePublicCopy(ev.source_title, 'summary') || "Official Policy Document",
                url: ev.source_url || undefined,
                excerpt: sanitizePublicCopy(ev.excerpt, 'summary'),
                date: ev.reviewed_at ? new Date(ev.reviewed_at).toLocaleDateString() : "Recent"
              }))} />
              
              <PolicyFreshnessBlock 
                lastReviewed={survivalPage?.last_reviewed_at ? new Date(survivalPage.last_reviewed_at).toLocaleDateString() : "Pending"}
                evidenceCount={redFlagsData.flatMap(rf => rf.evidence).length}
                redFlagCount={redFlags.length}
              />
            </div>

            <RelatedGuidesLoop 
              currentPlatformName={platform.name}
              relatedPlatforms={relatedPlatforms}
            />
            
            <RiskConceptLinks />

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
