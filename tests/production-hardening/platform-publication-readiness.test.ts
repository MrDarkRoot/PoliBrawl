import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluatePlatformPublicationSnapshot,
  type PlatformPublicationSnapshot,
} from "../../src/server/polibrawl/services/platform-publication-readiness.shared";
import type {
  Checklist,
  ChecklistItem,
  DependencyScore,
  EvidenceConfidence,
  EvidenceItem,
  Platform,
  PlatformSurvivalPage,
  RedFlag,
  ResolutionRoute,
  RiskTimeline,
  SurvivalNote,
} from "../../src/types/polibrawl";

function buildPlatform(overrides: Partial<Platform> = {}): Platform {
  return {
    id: "platform-1",
    slug: "paypal",
    name: "PayPal",
    category: "payment",
    status: "published",
    website_url: "https://www.paypal.com",
    summary:
      "PayPal remains a primary payment rail for many small businesses, so an account review can become a continuity risk quickly.",
    main_level: "high",
    disclaimer_text: null,
    internal_notes: null,
    last_reviewed_at: "2026-07-15T00:00:00.000Z",
    published_at: "2026-07-15T00:00:00.000Z",
    archived_at: null,
    created_at: "2026-07-15T00:00:00.000Z",
    updated_at: "2026-07-15T00:00:00.000Z",
    ...overrides,
  };
}

function buildSurvivalPage(
  overrides: Partial<PlatformSurvivalPage> = {},
): PlatformSurvivalPage {
  return {
    id: "page-1",
    platform_id: "platform-1",
    slug: "paypal",
    title: "PayPal Survival Page",
    summary: null,
    main_level: "high",
    status: "ready_for_publish",
    editorial_intro: null,
    survival_summary:
      "This guide explains what tends to happen when account access or payouts become constrained and what operators should prepare before then.",
    disclaimer_note:
      "PoliBrawl is independent editorial guidance based on official platform material. It is not legal advice and does not guarantee outcomes.",
    last_reviewed_at: "2026-07-15T00:00:00.000Z",
    ready_for_publish: true,
    archived_at: null,
    created_at: "2026-07-15T00:00:00.000Z",
    updated_at: "2026-07-15T00:00:00.000Z",
    ...overrides,
  };
}

function buildRedFlag(overrides: Partial<RedFlag> = {}): RedFlag {
  return {
    id: "red-flag-1",
    platform_id: "platform-1",
    slug: "account-limitation",
    title: "Account limitation",
    category: "account",
    level: "high",
    summary:
      "A limitation can interrupt withdrawals, payments, or account operations while the platform requests more information and controls the review timeline.",
    why_it_matters:
      "The business impact arrives before you can improvise a second route, so documentation and backup rails need to exist before the review starts.",
    status: "published",
    reviewed_at: "2026-07-15T00:00:00.000Z",
    published_at: "2026-07-15T00:00:00.000Z",
    archived_at: null,
    excerpt: null,
    source_id: "source-1",
    source_snapshot_id: null,
    keywords: [],
    primary_evidence_reference: null,
    created_at: "2026-07-15T00:00:00.000Z",
    updated_at: "2026-07-15T00:00:00.000Z",
    ...overrides,
  };
}

function buildEvidence(overrides: Partial<EvidenceItem> = {}): EvidenceItem {
  return {
    id: "evidence-1",
    red_flag_id: "red-flag-1",
    source_id: "source-1",
    excerpt:
      "The platform may limit account functionality while it reviews account activity and asks for documentation that supports the business profile.",
    source_title: "PayPal help article",
    source_url: "https://www.paypal.com/help/article/example",
    notes: null,
    sort_order: 0,
    status: "approved",
    reviewed_at: "2026-07-15T00:00:00.000Z",
    published_at: "2026-07-15T00:00:00.000Z",
    archived_at: null,
    created_at: "2026-07-15T00:00:00.000Z",
    updated_at: "2026-07-15T00:00:00.000Z",
    ...overrides,
  };
}

function buildSurvivalNote(overrides: Partial<SurvivalNote> = {}): SurvivalNote {
  return {
    id: "note-1",
    red_flag_id: "red-flag-1",
    note_title: "Before a review",
    note_body:
      "Keep recent transaction exports, ownership documents, and support correspondence outside the platform before restrictions begin.",
    priority: "high",
    status: "published",
    published_at: "2026-07-15T00:00:00.000Z",
    archived_at: null,
    created_at: "2026-07-15T00:00:00.000Z",
    updated_at: "2026-07-15T00:00:00.000Z",
    ...overrides,
  };
}

function buildChecklist(overrides: Partial<Checklist> = {}): Checklist {
  return {
    id: "checklist-1",
    platform_id: null,
    title: "Prepare evidence",
    intro: null,
    status: "published",
    published_at: "2026-07-15T00:00:00.000Z",
    red_flag_id: "red-flag-1",
    archived_at: null,
    created_at: "2026-07-15T00:00:00.000Z",
    updated_at: "2026-07-15T00:00:00.000Z",
    ...overrides,
  };
}

function buildChecklistItem(
  overrides: Partial<ChecklistItem> = {},
): ChecklistItem {
  return {
    id: "checklist-item-1",
    checklist_id: "checklist-1",
    label: "Export recent transaction history",
    details: null,
    sort_order: 0,
    status: "published",
    published_at: "2026-07-15T00:00:00.000Z",
    text: "Export recent transaction history",
    required: true,
    display_order: 0,
    archived_at: null,
    created_at: "2026-07-15T00:00:00.000Z",
    updated_at: "2026-07-15T00:00:00.000Z",
    ...overrides,
  };
}

function buildDependencyScore(
  overrides: Partial<DependencyScore> = {},
): DependencyScore {
  return {
    id: "dependency-1",
    platform_id: "platform-1",
    score: 78,
    risk_level: "high",
    factors: ["Primary payout provider", "No backup payout rail"],
    explanation:
      "Revenue collection and payout timing both depend on the same provider, so a limitation can become an immediate continuity issue.",
    generated_at: "2026-07-15T00:00:00.000Z",
    status: "published",
    published_at: "2026-07-15T00:00:00.000Z",
    archived_at: null,
    created_at: "2026-07-15T00:00:00.000Z",
    updated_at: "2026-07-15T00:00:00.000Z",
    ...overrides,
  };
}

function buildEvidenceConfidence(
  overrides: Partial<EvidenceConfidence> = {},
): EvidenceConfidence {
  return {
    id: "confidence-1",
    platform_id: "platform-1",
    score: 84,
    factors: ["Official agreement", "Current source"],
    last_verified_at: "2026-07-15T00:00:00.000Z",
    status: "published",
    published_at: "2026-07-15T00:00:00.000Z",
    archived_at: null,
    created_at: "2026-07-15T00:00:00.000Z",
    updated_at: "2026-07-15T00:00:00.000Z",
    ...overrides,
  };
}

function buildRiskTimeline(overrides: Partial<RiskTimeline> = {}): RiskTimeline {
  return {
    id: "timeline-1",
    platform_id: "platform-1",
    title: "Account limitation",
    events: [
      {
        label: "Day 1",
        detail: "The platform may request more information while access remains limited.",
      },
    ],
    source: "PayPal help article on account limitations",
    status: "published",
    published_at: "2026-07-15T00:00:00.000Z",
    display_order: 0,
    archived_at: null,
    created_at: "2026-07-15T00:00:00.000Z",
    updated_at: "2026-07-15T00:00:00.000Z",
    ...overrides,
  };
}

function buildResolutionRoute(
  overrides: Partial<ResolutionRoute> = {},
): ResolutionRoute {
  return {
    id: "route-1",
    platform_id: "platform-1",
    organization_name: "PayPal Resolution Center",
    organization_type: "Internal review",
    country: "Singapore",
    jurisdiction: "Singapore",
    official_url: "https://www.paypal.com/sg/cshelp/article/how-do-i-open-a-dispute-help160",
    eligible_users: ["PayPal account holders"],
    eligible_disputes: ["Account limitations"],
    requirements: ["Transaction history"],
    steps: ["Open the official resolution flow"],
    fees: null,
    limits: null,
    deadline: null,
    verification_source: "Official PayPal help documentation",
    last_verified_at: "2026-07-15T00:00:00.000Z",
    status: "published",
    published_at: "2026-07-15T00:00:00.000Z",
    display_order: 0,
    archived_at: null,
    created_at: "2026-07-15T00:00:00.000Z",
    updated_at: "2026-07-15T00:00:00.000Z",
    ...overrides,
  };
}

function buildSnapshot(
  overrides: Partial<PlatformPublicationSnapshot> = {},
): PlatformPublicationSnapshot {
  return {
    platform: buildPlatform(),
    survivalPage: buildSurvivalPage(),
    officialSourcesCount: 1,
    pageRedFlags: [
      {
        redFlag: buildRedFlag(),
        evidence: [buildEvidence()],
        survivalNotes: [buildSurvivalNote()],
        backupOptions: [],
        checklists: [buildChecklist()],
        checklistItems: [buildChecklistItem()],
      },
    ],
    publishedDependencyScores: [buildDependencyScore()],
    publishedEvidenceConfidence: [buildEvidenceConfidence()],
    publishedRiskTimelines: [buildRiskTimeline()],
    publishedResolutionRoutes: [buildResolutionRoute()],
    ...overrides,
  };
}

test("publication readiness fails when required public editorial data is missing", () => {
  const result = evaluatePlatformPublicationSnapshot(
    buildSnapshot({
      officialSourcesCount: 0,
      pageRedFlags: [
        {
          redFlag: buildRedFlag({ status: "draft" }),
          evidence: [],
          survivalNotes: [],
          backupOptions: [],
          checklists: [],
          checklistItems: [],
        },
      ],
    }),
  );

  assert.equal(result.ready, false);
  assert.match(result.errors.join(" "), /Missing active official source/);
  assert.match(result.errors.join(" "), /not published/);
  assert.match(result.errors.join(" "), /Missing published evidence/);
  assert.match(result.errors.join(" "), /Missing published survival notes/);
  assert.match(result.errors.join(" "), /Missing published checklist/);
});

test("publication readiness passes for a complete public snapshot", () => {
  const result = evaluatePlatformPublicationSnapshot(buildSnapshot());

  assert.equal(result.ready, true);
  assert.equal(result.errors.length, 0);
  assert.equal(result.publishedRedFlagsCount, 1);
});
