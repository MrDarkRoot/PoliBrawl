export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicFooter, PublicNav } from "@/components/public/layout";
import {
  DependencySnapshotCard,
  EvidenceConfidenceCard,
  ResolutionRoutesList,
  WhatHappensTimeline,
} from "@/components/public/ui/intelligence-components";
import {
  CopyWarningButton,
  PlatformDNA,
  PolicyFreshnessBlock,
  RelatedGuidesLoop,
  RiskConceptLinks,
} from "@/components/public/ui/retention-components";
import {
  BackupRailCard,
  EditorialMethodology,
  EvidenceAccordion,
  PlaybookPhaseCard,
  ReadingProgressNav,
  RiskMeterGrid,
  StoryRiskCard,
  SurvivalGuideHero,
  SurvivalPlaybook,
  SurvivalPriorityBlock,
  TodayActionCard,
  WhatToDoToday,
} from "@/components/public/ui/playbook-components";
import { sanitizePublicCopy } from "@/components/public/ui/copy-sanitizer";
import {
  getPublicBackupOptions,
  getPublicChecklists,
  getPublicDependencyScore,
  getPublicEvidence,
  getPublicEvidenceConfidence,
  getPublicPlatformBySlug,
  getPublicPlatforms,
  getPublicRedFlags,
  getPublicResolutionRoutes,
  getPublicRiskTimelines,
  getPublicSurvivalNotes,
  getPublicSurvivalPage,
} from "@/server/polibrawl/services/public-delivery.service";
import type { BackupOption, Platform } from "@/types/polibrawl";

const CATEGORY_LABELS: Record<string, string> = {
  payment: "Payment Platform",
  creator_freelance: "Creator & Freelance",
  saas_developer: "SaaS & Developer",
};

function getDependencyRecommendation(
  dependencyScore: Awaited<ReturnType<typeof getPublicDependencyScore>>,
  platformCategory: Platform["category"],
) {
  if (!dependencyScore) {
    return platformCategory === "payment"
      ? "Add a secondary payment rail before policy friction becomes an outage."
      : "Reduce single-platform dependency before a review turns into downtime.";
  }

  const normalizedFactors = dependencyScore.factors.map((factor) => factor.toLowerCase());

  if (normalizedFactors.some((factor) => factor.includes("no backup") || factor.includes("secondary"))) {
    return platformCategory === "payment"
      ? "Add a secondary payment rail and keep it operational now."
      : "Stand up a second provider before the primary platform becomes a bottleneck.";
  }

  if (normalizedFactors.some((factor) => factor.includes("payout") || factor.includes("withdraw"))) {
    return "Reduce payout concentration and test a second withdrawal path this week.";
  }

  if (normalizedFactors.some((factor) => factor.includes("revenue") || factor.includes("critical"))) {
    return "Move one critical workflow to a backup path before dependency turns into interruption.";
  }

  return dependencyScore.score >= 75
    ? "Treat this as a continuity risk and prepare an alternative operating path now."
    : "Review the failure points now, while you still have time to choose alternatives.";
}

function dedupeById<T extends { id: string }>(items: T[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const platform = await getPublicPlatformBySlug(slug);

  if (!platform) {
    return { title: "Not Found | PoliBrawl" };
  }

  const description =
    sanitizePublicCopy(platform.summary, "summary") ||
    `Survival guide for ${platform.name}. Understand account risk, payout restrictions, and continuity pressure before you depend on it.`;
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

  if (!platform) {
    notFound();
  }

  const [
    survivalPage,
    dependencyScore,
    resolutionRoutes,
    riskTimelines,
    evidenceConfidence,
    allPlatforms,
  ] = await Promise.all([
    getPublicSurvivalPage(platform.id),
    getPublicDependencyScore(platform.id),
    getPublicResolutionRoutes(platform.id),
    getPublicRiskTimelines(platform.id),
    getPublicEvidenceConfidence(platform.id),
    getPublicPlatforms(),
  ]);

  const redFlags = survivalPage ? await getPublicRedFlags(survivalPage.id) : [];
  const redFlagsData = await Promise.all(
    redFlags.map(async (redFlag) => {
      const [evidence, survivalNotes, backupOptions, checklists] = await Promise.all([
        getPublicEvidence(redFlag.id),
        getPublicSurvivalNotes(redFlag.id),
        getPublicBackupOptions(redFlag.id),
        getPublicChecklists(redFlag.id),
      ]);

      return {
        ...redFlag,
        evidence,
        survivalNotes,
        backupOptions,
        checklists,
      };
    }),
  );

  const relatedPlatforms = allPlatforms
    .filter((item) => item.slug !== slug)
    .slice(0, 6)
    .map((item) => ({
      name: item.name,
      slug: item.slug,
      riskLevel: item.main_level || "low",
      category: item.category,
    }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Survival Guides",
        item: "https://polibrawl.com/platforms",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: platform.name,
        item: `https://polibrawl.com/platforms/${platform.slug}`,
      },
    ],
  };

  const rawSummary = survivalPage?.survival_summary || platform.summary;
  const safeSummary =
    sanitizePublicCopy(rawSummary, "summary") ||
    "Review the official evidence, operational triggers, and backup options before this platform becomes a single point of failure.";
  const allChecklists = redFlagsData.flatMap((item) => item.checklists);
  const uniqueBackupOptions = dedupeById(
    redFlagsData.flatMap((item) => item.backupOptions),
  );
  const evidenceItems = redFlagsData.flatMap((item) => item.evidence).map((item) => ({
    title: sanitizePublicCopy(item.source_title, "summary") || "Official Policy Document",
    url: item.source_url || undefined,
    excerpt: sanitizePublicCopy(item.excerpt, "summary"),
    date: item.reviewed_at ? new Date(item.reviewed_at).toLocaleDateString() : "Recent",
  }));

  const isHighRisk =
    redFlags.some((item) => item.level === "high" || item.level === "critical") ||
    (dependencyScore?.score ?? 0) >= 70;

  const dependencyRecommendation = getDependencyRecommendation(
    dependencyScore,
    platform.category,
  );
  const priorityMessage = isHighRisk
    ? dependencyRecommendation
    : "Document your compliance evidence and backup path before pressure hits.";
  const prioritySubtext = dependencyScore?.explanation
    ? sanitizePublicCopy(dependencyScore.explanation, "summary")
    : "Operational continuity depends on what happens when a single platform review interrupts revenue or access.";

  let uncomfortableTruth = `Your operations on ${platform.name} may be interrupted before you have time to improvise a backup.`;
  if (platform.category === "payment") {
    uncomfortableTruth =
      "A single review can interrupt access to funds before you have time to move cash-flow elsewhere.";
  }

  const riskSnapshots = [
    { label: "Cash-Flow Risk", level: "Low", description: "Default risk level." },
    { label: "Account Access Risk", level: "Low", description: "Default risk level." },
    { label: "Verification Burden", level: "Low", description: "Default risk level." },
    { label: "Recovery Friction", level: "Low", description: "Default risk level." },
  ];

  redFlags.forEach((redFlag) => {
    let targetIndex = -1;
    if (redFlag.category === "money" || redFlag.category === "payout") {
      targetIndex = 0;
    }
    if (redFlag.category === "account") {
      targetIndex = 1;
    }
    if (redFlag.category === "kyc") {
      targetIndex = 2;
    }
    if (redFlag.category === "appeal") {
      targetIndex = 3;
    }

    if (targetIndex === -1) {
      return;
    }

    const currentScore =
      riskSnapshots[targetIndex].level === "critical"
        ? 10
        : riskSnapshots[targetIndex].level === "high"
          ? 8
          : riskSnapshots[targetIndex].level === "medium"
            ? 5
            : 2;
    const newScore =
      redFlag.level === "critical"
        ? 10
        : redFlag.level === "high"
          ? 8
          : redFlag.level === "medium"
            ? 5
            : 2;

    if (newScore > currentScore) {
      riskSnapshots[targetIndex].level = redFlag.level;
      riskSnapshots[targetIndex].description =
        sanitizePublicCopy(redFlag.summary, "summary") ||
        "Operational disruption may occur under specific conditions.";
    }
  });

  const defaultExposureSignals =
    platform.category === "payment"
      ? [
          "This platform is your main revenue or payout rail.",
          "You cannot absorb delayed withdrawals for more than a few days.",
          "You would struggle to move customer payments elsewhere this week.",
          "A dispute spike or verification request would stall operations fast.",
        ]
      : [
          "This platform runs a critical workflow you cannot replace in 48 hours.",
          "A review or lockout would interrupt customer delivery.",
          "Your team has not rehearsed a migration path away from this service.",
          "You rely on one account for access, billing, or operational data.",
        ];

  const exposureSignals =
    dependencyScore?.factors.length && dependencyScore.factors.length > 0
      ? dependencyScore.factors
      : defaultExposureSignals;

  const beforeActions = redFlagsData
    .flatMap((item) => item.survivalNotes)
    .filter(
      (note) =>
        note.note_title.toLowerCase().includes("before") ||
        note.note_title.toLowerCase().includes("prep"),
    );
  const duringActions = redFlagsData
    .flatMap((item) => item.survivalNotes)
    .filter(
      (note) =>
        note.note_title.toLowerCase().includes("during") ||
        note.note_title.toLowerCase().includes("review") ||
        note.note_title.toLowerCase().includes("limit"),
    );
  const afterActions = redFlagsData
    .flatMap((item) => item.survivalNotes)
    .filter(
      (note) =>
        note.note_title.toLowerCase().includes("after") ||
        note.note_title.toLowerCase().includes("recover"),
    );

  const disclaimerNote =
    sanitizePublicCopy(
      survivalPage?.disclaimer_note || platform.disclaimer_text,
      "summary",
    ) ||
    "PoliBrawl is independent editorial guidance based on official source material. It is not legal advice, a guarantee of outcome, or a promise of recovery.";

  const navLinks = [
    { id: "overview", label: "Overview" },
    { id: "risk-summary", label: "Risk Summary" },
    { id: "caught", label: "Why Users Get Caught" },
    { id: "dependency", label: "Dependency Snapshot" },
    { id: "timeline", label: "What Happens If" },
    { id: "playbook", label: "Survival Playbook" },
    { id: "actions", label: "What To Do Today" },
    { id: "escalate", label: "Where To Escalate" },
    { id: "backups", label: "Backup Options" },
    { id: "evidence", label: "Official Evidence" },
    { id: "disclaimer", label: "Disclaimer" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        type="application/ld+json"
      />
      <PublicNav />

      <main
        className="mx-auto flex-1 w-full max-w-[90rem] px-4 py-12 lg:px-8"
        id="main-content"
      >
        <div className="flex flex-col items-start gap-16 lg:flex-row">
          <ReadingProgressNav links={navLinks} />

          <div className="min-w-0 max-w-5xl flex-1">
            <div id="overview">
              <SurvivalGuideHero
                category={CATEGORY_LABELS[platform.category] ?? platform.category}
                lastReviewed={
                  survivalPage?.last_reviewed_at
                    ? new Date(survivalPage.last_reviewed_at).toLocaleDateString()
                    : "Pending"
                }
                name={platform.name}
                riskLevel={platform.main_level || "low"}
                summary={safeSummary}
                uncomfortableTruth={uncomfortableTruth}
                websiteUrl={platform.website_url || ""}
              >
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  <Link
                    className="inline-flex items-center justify-center rounded-lg border-2 border-slate-300 bg-slate-100 px-5 py-2.5 font-bold text-slate-800 shadow-sm transition-colors hover:bg-slate-200"
                    href={`/contribute?platform=${platform.id}#review`}
                  >
                    Request Review
                  </Link>
                  <Link
                    className="inline-flex items-center justify-center rounded-lg border-2 border-blue-200 bg-white px-5 py-2.5 font-bold text-blue-700 shadow-sm transition-colors hover:bg-blue-50"
                    href={`/contribute?platform=${platform.id}#watch`}
                  >
                    Watch Platform
                  </Link>
                </div>
              </SurvivalGuideHero>

              <SurvivalPriorityBlock
                heading="If you only do one thing"
                message={priorityMessage}
                subtext={prioritySubtext}
              />
            </div>

            <section className="space-y-8 scroll-mt-32" id="risk-summary">
              <div className="space-y-3">
                <h2 className="text-4xl font-black tracking-tight text-slate-900">
                  Risk Summary
                </h2>
                <p className="max-w-4xl text-xl font-medium leading-relaxed text-slate-600">
                  Read this page as an operating manual: what risk exists, what breaks first, and what you should prepare before you depend on this platform for continuity.
                </p>
              </div>

              <RiskMeterGrid risks={riskSnapshots} />
              <PlatformDNA redFlags={redFlags} />
            </section>

            <section className="scroll-mt-32 pt-4" id="caught">
              <div className="space-y-3">
                <h2 className="text-4xl font-black tracking-tight text-slate-900">
                  Why Users Get Caught
                </h2>
                <p className="max-w-4xl text-xl font-medium leading-relaxed text-slate-600">
                  The risk usually stays invisible until a normal workflow suddenly turns into a review, limitation, or payout disruption.
                </p>
              </div>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                {exposureSignals.map((signal, index) => (
                  <div
                    key={`${signal}-${index}`}
                    className="rounded-xl border-2 border-slate-200 bg-slate-50 p-6"
                  >
                    <span className="text-lg font-bold leading-snug text-slate-800">
                      {signal}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-10 space-y-8">
                {redFlags.length === 0 ? (
                  <p className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-10 text-xl font-medium text-slate-500">
                    No detailed risk profiles have been published yet.
                  </p>
                ) : (
                  redFlagsData.map((redFlag) => {
                    const whatCanHappen =
                      redFlag.level === "critical"
                        ? "Funds or account access may become unavailable before you can reroute operations."
                        : "Certain features, withdrawals, or account capabilities may pause while review is underway.";
                    const whyItHurts =
                      redFlag.level === "critical"
                        ? "Cash flow, customer support, refunds, or contractor payments may continue while your primary rail is constrained."
                        : "Operational friction increases and document burden rises while the platform controls the clock.";

                    return (
                      <div key={redFlag.id} className="relative">
                        <StoryRiskCard
                          href={`/red-flags/${redFlag.id}`}
                          prepareNow={
                            redFlag.survivalNotes[0]
                              ? sanitizePublicCopy(
                                  redFlag.survivalNotes[0].note_body,
                                  "action",
                                )
                              : "Document ownership, transaction history, and backup plans before problems begin."
                          }
                          severity={redFlag.level}
                          title={redFlag.title}
                          uncomfortableTruth={
                            sanitizePublicCopy(redFlag.summary, "hero") ||
                            "Policy pressure can surface abruptly under platform review."
                          }
                          whatCanHappen={whatCanHappen}
                          whyItHurts={whyItHurts}
                        />
                        <div className="mt-2 text-right">
                          <CopyWarningButton
                            platformName={platform.name}
                            riskTitle={redFlag.title}
                            url={`https://polibrawl.com/red-flags/${redFlag.id}`}
                            whyItMatters={whyItHurts}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <section className="scroll-mt-32 pt-4" id="dependency">
              <div className="space-y-3">
                <h2 className="text-4xl font-black tracking-tight text-slate-900">
                  Dependency Snapshot
                </h2>
                <p className="max-w-4xl text-xl font-medium leading-relaxed text-slate-600">
                  Risk is not just what the policy says. It is how much of your business depends on one platform when things go wrong.
                </p>
              </div>

              <div className="mt-8">
                <DependencySnapshotCard
                  recommendation={dependencyRecommendation}
                  score={dependencyScore}
                />
              </div>
            </section>

            <section className="scroll-mt-32 pt-4" id="timeline">
              <div className="space-y-3">
                <h2 className="text-4xl font-black tracking-tight text-slate-900">
                  What Happens If
                </h2>
                <p className="max-w-4xl text-xl font-medium leading-relaxed text-slate-600">
                  This translates abstract policy language into a verified sequence so you can plan around the first few hours and days.
                </p>
              </div>

              <div className="mt-8">
                <WhatHappensTimeline timelines={riskTimelines} />
              </div>
            </section>

            <div className="scroll-mt-32 pt-4" id="playbook">
              <SurvivalPlaybook>
                <PlaybookPhaseCard phase="Before anything happens" title="Prepare Now">
                  {beforeActions.length > 0 ? (
                    beforeActions.map((action) => (
                      <p key={action.id}>
                        {sanitizePublicCopy(action.note_body, "action")}
                      </p>
                    ))
                  ) : (
                    <>
                      <p>Export transaction records and keep them outside the platform.</p>
                      <p>Prepare ownership, formation, and banking evidence before you are asked for it.</p>
                      <p>Keep a second operating path ready for your highest-risk workflow.</p>
                    </>
                  )}
                </PlaybookPhaseCard>

                <PlaybookPhaseCard phase="If it happens today" title="Mitigate Damage">
                  {duringActions.length > 0 ? (
                    duringActions.map((action) => (
                      <p key={action.id}>
                        {sanitizePublicCopy(action.note_body, "action")}
                      </p>
                    ))
                  ) : (
                    <>
                      <p>Use the official review or support path and answer with exact, unmodified records.</p>
                      <p>Preserve transaction history, support replies, and your complaint timeline.</p>
                      <p>Do not create duplicate accounts or improvise around a platform restriction.</p>
                    </>
                  )}
                </PlaybookPhaseCard>

                <PlaybookPhaseCard phase="After recovery" title="Reduce Dependency">
                  {afterActions.length > 0 ? (
                    afterActions.map((action) => (
                      <p key={action.id}>
                        {sanitizePublicCopy(action.note_body, "action")}
                      </p>
                    ))
                  ) : (
                    <>
                      <p>Move one fragile workflow onto a backup path while things are calm.</p>
                      <p>Keep routine exports and documentation habits active.</p>
                      <p>Review whether this platform still deserves its current operational weight.</p>
                    </>
                  )}
                </PlaybookPhaseCard>
              </SurvivalPlaybook>
            </div>

            <div className="scroll-mt-32 pt-4" id="actions">
              <WhatToDoToday>
                {allChecklists.length === 0 ? (
                  <TodayActionCard
                    priority="High"
                    timeEstimate="5-10 min"
                    title="Export transaction records"
                    whyItMatters="If review starts unexpectedly, you will need records immediately instead of reconstructing them under pressure."
                  />
                ) : (
                  allChecklists.flatMap((checklist) =>
                    checklist.items.map((item) => (
                      <TodayActionCard
                        key={item.id}
                        priority={item.required ? "High" : "Medium"}
                        timeEstimate="10-15 min"
                        title={sanitizePublicCopy(item.text || item.label, "action")}
                        whyItMatters={
                          item.required
                            ? "Critical preparation step tied to official policy triggers."
                            : "Recommended operating hygiene before a disruption escalates."
                        }
                      />
                    )),
                  )
                )}
              </WhatToDoToday>
            </div>

            <section className="scroll-mt-32 pt-4" id="escalate">
              <div className="space-y-3">
                <h2 className="text-4xl font-black tracking-tight text-slate-900">
                  Where To Escalate
                </h2>
                <p className="max-w-4xl text-xl font-medium leading-relaxed text-slate-600">
                  After you complete the immediate checklist, these may be available escalation routes to review.
                </p>
              </div>

              <div className="mt-8">
                <ResolutionRoutesList routes={resolutionRoutes} />
              </div>
            </section>

            <section className="scroll-mt-32 pt-4" id="backups">
              <div className="space-y-3">
                <h2 className="text-4xl font-black tracking-tight text-slate-900">
                  Backup Options
                </h2>
                <p className="max-w-4xl text-xl font-medium leading-relaxed text-slate-600">
                  Alternatives reduce dependency only when you understand their tradeoffs before the primary route breaks.
                </p>
              </div>

              <div className="mt-8 grid gap-8 md:grid-cols-2">
                {uniqueBackupOptions.length === 0 ? (
                  <p className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-10 text-xl font-medium text-slate-500 md:col-span-2">
                    No backup options have been published yet.
                  </p>
                ) : (
                  uniqueBackupOptions.map((backup: BackupOption) => (
                    <BackupRailCard
                      key={backup.id}
                      riskReduced="Single-platform operational dependency."
                      title={backup.name || backup.label}
                      tradeoffs={
                        sanitizePublicCopy(backup.tradeoffs, "action") ||
                        "Setup time, implementation complexity, and fee differences."
                      }
                      whenToUse={
                        sanitizePublicCopy(backup.summary, "action") ||
                        "Before your primary operating path is constrained."
                      }
                    />
                  ))
                )}
              </div>
            </section>

            <section className="scroll-mt-32 pt-4" id="evidence">
              <div className="space-y-3">
                <h2 className="text-4xl font-black tracking-tight text-slate-900">
                  Official Evidence
                </h2>
                <p className="max-w-4xl text-xl font-medium leading-relaxed text-slate-600">
                  Every public claim should tie back to official platform material. Confidence reflects freshness and source quality, not hidden internal scoring.
                </p>
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div>
                  <EvidenceAccordion items={evidenceItems} />
                </div>
                <div className="pt-16 lg:pt-0">
                  <EvidenceConfidenceCard confidence={evidenceConfidence} />
                </div>
              </div>

              <PolicyFreshnessBlock
                evidenceCount={evidenceItems.length}
                lastReviewed={
                  survivalPage?.last_reviewed_at
                    ? new Date(survivalPage.last_reviewed_at).toLocaleDateString()
                    : "Pending"
                }
                redFlagCount={redFlags.length}
              />
            </section>

            <section className="scroll-mt-32 pt-4" id="disclaimer">
              <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-8">
                <h2 className="text-3xl font-black text-slate-900">Disclaimer</h2>
                <p className="mt-4 text-lg font-medium leading-relaxed text-slate-700">
                  {disclaimerNote}
                </p>
              </div>

              <EditorialMethodology />
            </section>

            <RelatedGuidesLoop
              currentPlatformName={platform.name}
              relatedPlatforms={relatedPlatforms}
            />

            <RiskConceptLinks />

            <div
              className="my-12 rounded-2xl border-2 border-slate-200 bg-white p-8 scroll-mt-32"
              id="community"
            >
              <h3 className="mb-4 text-2xl font-black text-slate-900">
                Help the community survive
              </h3>
              <p className="mb-6 font-medium text-slate-600">
                Found a new risk, a reliable backup option, or an outdated policy? Your operational experience helps protect other users, but it stays separate from the core editorial layer until reviewed.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  className="rounded-lg border border-slate-300 bg-slate-100 px-5 py-2.5 font-bold text-slate-700 hover:bg-slate-200"
                  href={`/contribute?platform=${platform.id}#experience`}
                >
                  Submit Experience
                </Link>
                <Link
                  className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-2.5 font-bold text-amber-700 hover:bg-amber-100"
                  href={`/contribute?platform=${platform.id}#tip`}
                >
                  Suggest Survival Tip
                </Link>
                <Link
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-2.5 font-bold text-emerald-700 hover:bg-emerald-100"
                  href={`/contribute?platform=${platform.id}#correction`}
                >
                  Report Correction
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
