/**
 * calibrated-template-editorial-ai-provider.ts
 *
 * Sprint 10.5 — Editorial Intelligence Calibration
 *
 * Replaces the generic LocalTemplateEditorialAIProvider with a calibrated
 * provider that uses:
 * - Enriched editorial context (platform + category + evidence + user + action)
 * - Category-specific templates
 * - Platform-specific language
 *
 * This provider is deterministic and does not call external APIs.
 * It produces materially better drafts by:
 * 1. Using the actual platform name throughout
 * 2. Incorporating specific evidence language
 * 3. Using category-appropriate section structure
 * 4. Writing specific operational consequences
 * 5. Including evidence limitations and unsupported inferences explicitly
 *
 * The editorial critic (editorial-critic.service.ts) runs after generation
 * in the calibrated workflow — this provider focuses only on producing
 * a high-quality initial candidate.
 */

import type { EditorialDraftBackupOption } from "@/types/polibrawl";
import type {
  EditorialAIProvider,
  EditorialDraftGenerationInput,
} from "@/server/polibrawl/services/editorial/editorial-ai-provider";
import type { EditorialDraftTemplateOutput } from "@/server/polibrawl/services/editorial/templates/shared";
import {
  enrichEditorialContext,
  type EnrichedEditorialContext,
} from "@/server/polibrawl/services/editorial/editorial-context-enrichment.service";
import { getCategoryEditorialTemplate } from "@/server/polibrawl/services/editorial/category-editorial-templates";
import type { ResearchPacketWithEvidence } from "@/types/polibrawl";

// ─── Title Generation ─────────────────────────────────────────────────────────

const categoryTitles: Record<string, (platformName: string) => string> = {
  money: (p) => `${p}: Preparing for Fund Hold and Reserve Conditions`,
  payout: (p) => `${p}: Payout Continuity and Settlement Risk Preparation`,
  account_restriction: (p) => `${p}: Account Access Risk and Continuity Preparation`,
  kyc_verification: (p) => `${p}: Verification Request Readiness`,
  dispute_chargeback: (p) => `${p}: Dispute and Chargeback Risk Preparation`,
  data_access: (p) => `${p}: Data Access Continuity`,
  termination: (p) => `${p}: Account Termination Risk and Business Continuity`,
  appeal_escalation: (p) => `${p}: Appeal and Escalation Preparation`,
  // Sprint 10 legacy mappings
  account: (p) => `${p}: Account Access Risk and Continuity Preparation`,
  kyc: (p) => `${p}: Verification Request Readiness`,
  appeal: (p) => `${p}: Appeal and Escalation Preparation`,
  dispute: (p) => `${p}: Dispute and Chargeback Risk Preparation`,
  data_saas: (p) => `${p}: Data Access Continuity`,
  api: (p) => `${p}: API Access and Integration Continuity`,
  legal: (p) => `${p}: Terms Risk and Operational Continuity`,
};

function buildTitle(category: string, platformName: string): string {
  const titleFn = categoryTitles[category];
  return titleFn
    ? titleFn(platformName)
    : `${platformName}: Operational Risk Preparation`;
}

// ─── Summary Generation ───────────────────────────────────────────────────────

function buildSummary(
  packet: ResearchPacketWithEvidence,
  context: EnrichedEditorialContext,
): string {
  const platformName = context.platform.platformName;
  const category = context.risk.riskCategory;
  const excerpts = context.evidence.strongestExcerpts;

  if (excerpts.length === 0) {
    return `${platformName}'s official terms address ${context.risk.affectedAsset.toLowerCase()}. Businesses that depend on ${platformName} for ${context.risk.affectedWorkflow.toLowerCase()} should prepare before changes affect operations.`;
  }

  const topExcerpt = excerpts[0];
  const section = topExcerpt.sectionHint ? `in the ${topExcerpt.sectionHint} section` : "in its official terms";
  const sourceRef = topExcerpt.sourceUrl ? "the linked official source" : "the official source in this research packet";

  const categoryIntro: Record<string, string> = {
    money: `${platformName}'s official terms, reviewed from ${sourceRef}, include language ${section} that reserves the right to hold balances or apply reserves to accounts under review.`,
    payout: `${platformName}'s official terms, reviewed from ${sourceRef}, include language ${section} addressing payout review, settlement timing, or withdrawal conditions.`,
    account_restriction: `${platformName}'s official terms, reviewed from ${sourceRef}, include language ${section} permitting account limitation, suspension, or restriction of specific account functions.`,
    kyc_verification: `${platformName}'s official terms, reviewed from ${sourceRef}, include language ${section} describing identity, business, or ownership verification requirements.`,
    dispute_chargeback: `${platformName}'s official terms, reviewed from ${sourceRef}, include language ${section} governing dispute handling, chargeback liability, and associated account consequences.`,
    data_access: `${platformName}'s official terms, reviewed from ${sourceRef}, include language ${section} covering data access, retention, and service interruption conditions.`,
    termination: `${platformName}'s official terms, reviewed from ${sourceRef}, include language ${section} defining grounds under which accounts may be terminated and describing the consequences for held funds.`,
    appeal_escalation: `${platformName}'s official terms, reviewed from ${sourceRef}, include language ${section} describing available review, appeal, or dispute escalation processes.`,
  };

  const intro = categoryIntro[category]
    ?? `${platformName}'s official terms, reviewed from ${sourceRef}, include language ${section} affecting operational continuity for dependent businesses.`;

  return `${intro} If ${platformName} is a primary operational rail for your business — whether for payment collection, payout processing, or account management — that language may affect ${context.risk.affectedAsset.toLowerCase()} before you have time to prepare a fallback.`;
}

// ─── Who Is Affected ─────────────────────────────────────────────────────────

function buildWhoIsAffected(context: EnrichedEditorialContext): string[] {
  const platformName = context.platform.platformName;
  const base = context.user.likelyAffectedGroups.map((group) =>
    group.includes(platformName) ? group : `${group} on ${platformName}`,
  );

  // Add a "users not affected" note as a separate item for clarity
  if (context.user.usersMayNotBeAffected.length > 0) {
    base.push(
      `Less likely to be immediately affected: ${context.user.usersMayNotBeAffected[0].toLowerCase()}`,
    );
  }

  return base.slice(0, 4); // cap at 4 per schema
}

// ─── Why It Matters ───────────────────────────────────────────────────────────

function buildWhyItMatters(
  packet: ResearchPacketWithEvidence,
  context: EnrichedEditorialContext,
): string {
  const platformName = context.platform.platformName;
  const excerpts = context.evidence.strongestExcerpts;

  const operationalConsequence = context.risk.likelyOperationalInterruption;
  const continuityConcern = context.risk.potentialContinuityConcern;
  const dependencyImpact = context.risk.dependencyImpact;

  const evidenceNote =
    excerpts.length > 0
      ? ` The official source language is not hypothetical — it describes authority the platform currently holds under its terms.`
      : "";

  return `${operationalConsequence.charAt(0).toUpperCase() + operationalConsequence.slice(1)} is a realistic operational scenario for any business that has made ${platformName} a primary rail without a parallel backup. ${continuityConcern.charAt(0).toUpperCase() + continuityConcern.slice(1)} can develop faster than most businesses expect once an account review begins. ${dependencyImpact.charAt(0).toUpperCase() + dependencyImpact.slice(1)}.${evidenceNote} The goal of this guide is not to predict what will happen, but to describe preparation steps that reduce operational exposure before an incident.`;
}

// ─── Survival Actions ─────────────────────────────────────────────────────────

function buildSurvivalActions(context: EnrichedEditorialContext): string[] {
  const platformName = context.platform.platformName;
  const actions = [
    ...context.action.preparationActions,
    ...context.action.evidencePreservationActions.slice(0, 2),
  ];

  // Inject platform name into generic actions where beneficial
  return actions
    .slice(0, 5)
    .map((action) =>
      action.toLowerCase().includes(platformName.toLowerCase())
        ? action
        : action.replace(/^(identify|map|prepare|keep|review|export|confirm|save|assign|notify)/i, `$1`),
    );
}

// ─── Checklist Items ──────────────────────────────────────────────────────────

function buildChecklistItems(context: EnrichedEditorialContext): string[] {
  const platformName = context.platform.platformName;
  const items = [
    ...context.action.evidencePreservationActions,
    ...context.action.continuityActions,
    ...context.action.escalationActionsIfSupported.slice(0, 1),
  ];

  return items
    .filter((item) => item.length > 10)
    .slice(0, 8)
    .map((item) =>
      !item.includes(platformName) && item.toLowerCase().includes("platform")
        ? item.replace(/this platform|the platform/gi, platformName)
        : item,
    );
}

// ─── Backup Options ───────────────────────────────────────────────────────────

const categoryBackupOptions: Record<string, EditorialDraftBackupOption[]> = {
  money: [
    {
      label: "Secondary payment processor (parallel operation)",
      tradeoff:
        "Requires onboarding, compliance review, and parallel reconciliation. Fee structures differ from your primary processor. Build this before you need it — it typically takes weeks to activate and verify.",
    },
    {
      label: "Direct bank transfer or invoice-based collection",
      tradeoff:
        "Lower automation, longer settlement times, and requires clients to accept payment terms changes. Preserves collections during a platform review but does not scale easily.",
    },
  ],
  payout: [
    {
      label: "Alternate payout provider (e.g., Wise, Payoneer)",
      tradeoff:
        "Each provider has its own settlement window, verification requirements, and fee structure. Treating it as an immediate drop-in replacement may result in unexpected delays.",
    },
    {
      label: "Short-term direct invoicing to major clients",
      tradeoff:
        "Manual, slower, and requires renegotiating payment terms. Useful for the highest-revenue clients during a payout disruption, but not scalable across a full customer base.",
    },
  ],
  account_restriction: [
    {
      label: "Secondary operating account on a different platform",
      tradeoff:
        "Requires duplicate controls, reconciliation, and customer communication. Reduces single-platform concentration risk but adds operational overhead.",
    },
    {
      label: "Manual invoice and bank transfer workflow",
      tradeoff:
        "Viable for short disruptions. Slower and labor-intensive — does not scale well if the restriction extends beyond a few days.",
    },
  ],
  kyc_verification: [
    {
      label: "Secondary merchant account for continuity",
      tradeoff:
        "Requires its own identity and business verification process, which may also experience delays. Useful as a parallel route but not an instant solution.",
    },
    {
      label: "Bank-transfer fallback for critical clients",
      tradeoff:
        "Lower conversion and higher manual effort. Suitable as a bridge for essential clients while verification is pending on the primary account.",
    },
  ],
  dispute_chargeback: [
    {
      label: "Secondary payment processor with independent dispute handling",
      tradeoff:
        "The secondary processor will also apply its own chargeback threshold policies. This reduces concentration risk but does not eliminate dispute exposure.",
    },
  ],
  data_access: [
    {
      label: "Scheduled data export to independent storage",
      tradeoff:
        "Requires maintenance, storage costs, and a defined export schedule. Reduces dependency on live platform access but does not provide real-time sync.",
    },
    {
      label: "Secondary operational system",
      tradeoff:
        "Requires data migration and validation. Significant up-front investment but provides a fully independent fallback for critical workflows.",
    },
  ],
  termination: [
    {
      label: "Equivalent alternative platform (built in advance)",
      tradeoff:
        "Building a fully equivalent alternative requires months of onboarding, reputation building, and customer migration. This cannot be built after termination occurs.",
    },
    {
      label: "Direct client relationships and communication channels",
      tradeoff:
        "Maintaining direct email or contract relationships with clients reduces platform dependency, but requires ongoing relationship management outside the platform.",
    },
  ],
  appeal_escalation: [
    {
      label: "Financial regulator or independent ombudsman (where eligible)",
      tradeoff:
        "Eligibility varies by jurisdiction and dispute type. May involve process fees and long resolution timelines. Does not guarantee a favorable outcome.",
    },
    {
      label: "Parallel backup operational route (active during appeal)",
      tradeoff:
        "Activating a backup route during an appeal may signal reduced dependency, which could affect appeal leverage. Weigh this trade-off against cash-flow continuity needs.",
    },
  ],
};

const defaultBackupOptions: EditorialDraftBackupOption[] = [
  {
    label: "Secondary operating platform",
    tradeoff:
      "Adds setup, compliance, and reconciliation overhead. Reduces single-platform dependency but requires time to build and verify before it is needed.",
  },
];

function buildBackupOptions(category: string): EditorialDraftBackupOption[] {
  // Legacy category mapping
  const legacyMap: Record<string, string> = {
    account: "account_restriction",
    kyc: "kyc_verification",
    appeal: "appeal_escalation",
    dispute: "dispute_chargeback",
    data_saas: "data_access",
    api: "data_access",
    legal: "account_restriction",
  };

  const key = category in categoryBackupOptions ? category : (legacyMap[category] ?? "");
  return categoryBackupOptions[key] ?? defaultBackupOptions;
}

// ─── Evidence Summary ─────────────────────────────────────────────────────────

function buildEvidenceSummary(
  context: EnrichedEditorialContext,
): string {
  const excerpts = context.evidence.strongestExcerpts;

  if (excerpts.length === 0) {
    return "No specific evidence excerpts were available from this research packet. This draft is based on category-level guidance only and has lower confidence than evidence-grounded drafts.";
  }

  const excerptDescriptions = excerpts.slice(0, 2).map((e) => {
    const sectionRef = e.sectionHint ? ` (from: ${e.sectionHint})` : "";
    return `"${e.excerpt.slice(0, 200).trim()}..."${sectionRef}`;
  });

  const limitations = context.evidence.evidenceLimitations.slice(0, 2).join(" ");
  const unsupported = context.evidence.unsupportedInferences[0]
    ? ` ${context.evidence.unsupportedInferences[0]}.`
    : "";

  return `Selected official excerpts from the research packet: ${excerptDescriptions.join("; ")}. Evidence strength: ${context.evidence.evidenceStrength}. ${limitations}${unsupported}`;
}

// ─── Confidence Scoring ───────────────────────────────────────────────────────

function scoreCalibratedConfidence(packet: ResearchPacketWithEvidence): number {
  const evidenceCount = packet.evidence.length;
  const avgConfidence =
    evidenceCount > 0
      ? packet.evidence.reduce((sum, e) => sum + e.confidence_score, 0) / evidenceCount
      : 0;
  const avgNoise =
    evidenceCount > 0
      ? packet.evidence.reduce((sum, e) => sum + e.noise_score, 0) / evidenceCount
      : 50;

  const baseScore =
    avgConfidence * 0.5 + evidenceCount * 3 - avgNoise * 0.2 + packet.confidence_score * 0.3;

  return Math.round(Math.max(20, Math.min(85, baseScore)));
}

// ─── Provider Implementation ──────────────────────────────────────────────────

/**
 * CalibratedTemplateEditorialAIProvider
 *
 * Sprint 10.5 calibrated provider. Uses enriched context and category templates
 * to produce platform-specific, evidence-grounded drafts.
 *
 * Compatible with the EditorialAIProvider interface — can be used anywhere
 * LocalTemplateEditorialAIProvider is used.
 */
export class CalibratedTemplateEditorialAIProvider implements EditorialAIProvider {
  readonly name = "CalibratedTemplateEditorialAIProvider_v1";

  async generateDraft(
    input: EditorialDraftGenerationInput,
  ): Promise<EditorialDraftTemplateOutput> {
    const { packet } = input;

    const context = enrichEditorialContext(packet);
    const { template: categoryTemplate } = getCategoryEditorialTemplate(packet.category);

    const platformName = context.platform.platformName;
    const category = packet.category;

    return {
      title: buildTitle(category, platformName),
      summary: buildSummary(packet, context),
      who_is_affected: buildWhoIsAffected(context),
      why_it_matters: buildWhyItMatters(packet, context),
      survival_actions: buildSurvivalActions(context),
      checklist_items: buildChecklistItems(context),
      backup_options: buildBackupOptions(category),
      evidence_summary: buildEvidenceSummary(context),
      ai_confidence: scoreCalibratedConfidence(packet),
    };

    void categoryTemplate; // available for future use — template key is stored by calibrated workflow
  }
}
