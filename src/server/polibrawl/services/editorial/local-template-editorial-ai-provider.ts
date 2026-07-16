import type {
  EditorialDraftBackupOption,
  ResearchPacketWithEvidence,
} from "@/types/polibrawl";

import type {
  EditorialAIProvider,
  EditorialDraftGenerationInput,
} from "@/server/polibrawl/services/editorial/editorial-ai-provider";
import type { EditorialDraftTemplateOutput } from "@/server/polibrawl/services/editorial/templates/shared";

type CategoryCopy = {
  titleSuffix: string;
  summaryFocus: string;
  audience: string[];
  whyItMatters: string;
  actions: string[];
  checklist: string[];
  backupOptions: EditorialDraftBackupOption[];
};

const categoryCopy: Record<string, CategoryCopy> = {
  money: {
    titleSuffix: "Funds Hold Preparedness",
    summaryFocus:
      "official policy language covering reserves, holds, or delayed balance access",
    audience: [
      "Businesses relying on the platform for incoming funds or stored balances",
      "Operators that cannot absorb delayed access to payout cash flow",
    ],
    whyItMatters:
      "If incoming funds or reserve balances become less available than expected, payroll, supplier payments, and fulfillment can tighten before an appeal path is clear.",
    actions: [
      "Map which cash commitments depend on this platform in the next seven days.",
      "Prepare recent transaction records and customer fulfillment proof before a review starts.",
      "Keep a secondary payout or collection route active before you need it.",
    ],
    checklist: [
      "Export recent transaction history and settlement records.",
      "Keep invoices, delivery proof, and customer communication organized.",
      "Confirm where reserve or hold notices are delivered inside the account.",
      "Maintain an active secondary payout route for continuity.",
    ],
    backupOptions: [
      {
        label: "Secondary payment processor",
        tradeoff:
          "Adds onboarding and fee overhead, but reduces dependence on a single funds rail.",
      },
      {
        label: "Direct bank transfer workflow",
        tradeoff:
          "Can preserve collections during a platform review, but usually increases manual operations.",
      },
    ],
  },
  account: {
    titleSuffix: "Account Access Continuity",
    summaryFocus:
      "official language allowing account limitation, suspension, or access controls",
    audience: [
      "Businesses using the platform as a primary operating account",
      "Teams that need uninterrupted access to balances, disputes, or payout controls",
    ],
    whyItMatters:
      "An account limitation can interrupt operations before a business has time to reconstruct documents, notify customers, or shift volume to another rail.",
    actions: [
      "Pre-stage the documents most likely to support an account review response.",
      "Identify which workflows fail first if the primary account becomes limited.",
      "Route critical customer communication through systems outside the affected platform.",
    ],
    checklist: [
      "Export recent account activity and settlement logs.",
      "Keep identity, business registration, and ownership documents current.",
      "Document customer service and fulfillment evidence for recent transactions.",
      "Test at least one alternative payment or payout route.",
    ],
    backupOptions: [
      {
        label: "Secondary operating rail",
        tradeoff:
          "Requires duplicate controls and reconciliation, but shortens recovery time if access is limited.",
      },
      {
        label: "Manual invoice collection",
        tradeoff:
          "Slower than automated flows, but can preserve collections while an account review is pending.",
      },
    ],
  },
  kyc: {
    titleSuffix: "Verification Response Readiness",
    summaryFocus:
      "official requirements for identity, ownership, or business verification",
    audience: [
      "Businesses asked to confirm identity, ownership, or operating activity",
      "Teams whose payment flow depends on a quick verification response",
    ],
    whyItMatters:
      "A slow or incomplete verification response can delay payment operations even when the underlying business activity is legitimate.",
    actions: [
      "Centralize the latest ownership, identity, and business registration records.",
      "Assign a single owner for platform verification responses and deadlines.",
      "Review whether payout or payment continuity depends on one verified account only.",
    ],
    checklist: [
      "Store current government ID and business registration documents.",
      "Keep beneficial ownership and business address records current.",
      "Track who can respond to platform verification requests immediately.",
      "Maintain a secondary payment route if verification delays would disrupt revenue.",
    ],
    backupOptions: [
      {
        label: "Secondary merchant account",
        tradeoff:
          "Adds compliance and onboarding work, but reduces interruption risk if one provider pauses verification.",
      },
      {
        label: "Bank-transfer fallback",
        tradeoff:
          "Lower automation and potentially slower customer conversion, but useful during verification delays.",
      },
    ],
  },
  payout: {
    titleSuffix: "Payout Continuity Draft",
    summaryFocus:
      "official wording about payout review, settlement timing, or withdrawal restrictions",
    audience: [
      "Businesses depending on predictable payout timing for daily operations",
      "Teams with supplier, payroll, or advertising spend tied to settlement windows",
    ],
    whyItMatters:
      "When payout timing changes or reviews extend, working-capital assumptions can break before a business has time to re-plan cash movement.",
    actions: [
      "Model the effect of delayed settlement on the next operating cycle.",
      "Identify the first payments that would fail if payouts move later than expected.",
      "Keep an alternative collection or payout route ready before a review notice arrives.",
    ],
    checklist: [
      "Export recent payout reports and settlement history.",
      "Track expected cash commitments against payout timing.",
      "Document the support path for payout review cases.",
      "Maintain a second route for critical collections or withdrawals.",
    ],
    backupOptions: [
      {
        label: "Alternate payout provider",
        tradeoff:
          "Requires parallel reconciliation, but gives the business another settlement route if timing changes.",
      },
      {
        label: "Short-term direct invoicing",
        tradeoff:
          "More manual and slower to scale, but can reduce pressure during payout disruption.",
      },
    ],
  },
  appeal: {
    titleSuffix: "Appeal Preparation Draft",
    summaryFocus:
      "official language about reviews, disputes, or decision appeals",
    audience: [
      "Businesses that may need to challenge a platform decision",
      "Operators who need a documented escalation path during a dispute",
    ],
    whyItMatters:
      "If the review path is narrow or document-heavy, the business needs a response package ready before an adverse decision affects cash flow or account access.",
    actions: [
      "Capture a dated timeline of the account issue and platform responses.",
      "Preserve supporting documents in the order a reviewer would need them.",
      "Identify any external escalation route that may apply before deadlines move.",
    ],
    checklist: [
      "Save official notices, case IDs, and timestamps.",
      "Keep transaction, fulfillment, and communication evidence together.",
      "Write a concise issue timeline before details fade.",
      "Confirm whether an independent dispute route may apply.",
    ],
    backupOptions: [
      {
        label: "Independent dispute route",
        tradeoff:
          "Can add process time and eligibility limits, but may provide another escalation path.",
      },
      {
        label: "Operational fallback rail",
        tradeoff:
          "Requires duplicate setup, but reduces dependence while a dispute is unresolved.",
      },
    ],
  },
  data_saas: {
    titleSuffix: "Data Continuity Draft",
    summaryFocus:
      "official terms covering data access, retention, or service interruption",
    audience: [
      "Businesses storing operational data in the platform",
      "Teams that need exports or backups to preserve continuity",
    ],
    whyItMatters:
      "If access changes before exports are complete, reporting, customer service, and downstream systems can lose critical operating context.",
    actions: [
      "Map which reports or customer records would be hardest to rebuild.",
      "Keep a routine export path active while access is normal.",
      "Document recovery steps for systems that depend on the platform's data.",
    ],
    checklist: [
      "Export current account data on a repeatable schedule.",
      "Verify who owns the export process and storage location.",
      "Test whether downstream tools still function from exported data.",
      "Keep an alternate workflow for critical records if access changes.",
    ],
    backupOptions: [
      {
        label: "Scheduled data export mirror",
        tradeoff:
          "Takes recurring effort to maintain, but reduces dependency on live platform access.",
      },
      {
        label: "Secondary operating system",
        tradeoff:
          "Adds migration overhead, but gives the business another place to continue core workflows.",
      },
    ],
  },
  api: {
    titleSuffix: "Integration Continuity Draft",
    summaryFocus:
      "official terms affecting API access, quotas, or suspension conditions",
    audience: [
      "Teams whose revenue or delivery flow depends on platform APIs",
      "Operators who need stable integrations for payments or account operations",
    ],
    whyItMatters:
      "If API access changes under quota, review, or suspension rules, automation can fail faster than manual recovery plans are ready.",
    actions: [
      "Document which customer-facing workflows fail first if the API becomes unavailable.",
      "Keep a manual fallback path for critical transactions or support cases.",
      "Review alerting so integration failures are visible immediately.",
    ],
    checklist: [
      "Map the automations that depend on this API.",
      "Store API-related support contacts and escalation steps.",
      "Prepare manual handling for the highest-value workflows.",
      "Maintain an alternate route if the integration is revenue-critical.",
    ],
    backupOptions: [
      {
        label: "Secondary integration path",
        tradeoff:
          "Adds engineering and monitoring overhead, but reduces outage concentration on one API.",
      },
      {
        label: "Manual operations fallback",
        tradeoff:
          "Less efficient at scale, but can preserve essential service during an API interruption.",
      },
    ],
  },
  legal: {
    titleSuffix: "Terms Risk Review",
    summaryFocus:
      "official legal terms that affect dispute options, liability, or operational remedies",
    audience: [
      "Businesses that need to understand contractual risk before an incident",
      "Operators whose fallback options narrow when disputes become formal",
    ],
    whyItMatters:
      "When legal terms narrow recourse or shift responsibility, the operational response needs to start earlier because recovery options may be limited later.",
    actions: [
      "Flag the terms for legal or compliance review before an incident occurs.",
      "Document what evidence would matter most if a dispute escalates.",
      "Pair the legal review with an operational backup plan so continuity does not depend on one outcome.",
    ],
    checklist: [
      "Save the current official terms and review date.",
      "Map which business workflows depend on the disputed service.",
      "Preserve transaction and support evidence before any escalation.",
      "Maintain a backup operating route if the contractual path narrows.",
    ],
    backupOptions: [
      {
        label: "Secondary provider contract",
        tradeoff:
          "Adds procurement overhead, but reduces dependence on one contractual risk profile.",
      },
      {
        label: "Internal contingency workflow",
        tradeoff:
          "Can be slower and less efficient, but preserves operations while legal review continues.",
      },
    ],
  },
};

function getCategoryCopy(packet: ResearchPacketWithEvidence) {
  return categoryCopy[packet.category] ?? {
    titleSuffix: "Operational Risk Draft",
    summaryFocus: "official policy language affecting operational continuity",
    audience: [
      `Businesses using ${packet.platform_name ?? "this platform"} in a critical workflow`,
    ],
    whyItMatters:
      "If the policy language changes operational access, the business needs documentation, fallback routes, and a response plan before disruption arrives.",
    actions: [
      "Identify the workflows that depend on this platform right now.",
      "Collect the documents needed to respond if the platform requests more information.",
      "Maintain at least one backup path for the affected operation.",
    ],
    checklist: [
      "Export the latest operational records tied to the platform.",
      "Keep business and identity documentation current.",
      "Document the fastest escalation path available.",
      "Test a backup workflow before it is urgent.",
    ],
    backupOptions: [
      {
        label: "Secondary operating rail",
        tradeoff:
          "Adds overhead, but reduces single-platform dependency during a disruption.",
      },
    ],
  };
}

function selectEvidenceSummary(packet: ResearchPacketWithEvidence) {
  const strongestEvidence = [...packet.evidence]
    .sort((left, right) => {
      if (right.confidence_score !== left.confidence_score) {
        return right.confidence_score - left.confidence_score;
      }

      if (left.noise_score !== right.noise_score) {
        return left.noise_score - right.noise_score;
      }

      return left.display_order - right.display_order;
    })
    .slice(0, 2);

  return strongestEvidence
    .map((item) => {
      const section = item.section_hint ? `${item.section_hint}: ` : "";
      const excerpt = item.excerpt.replace(/\s+/g, " ").trim();
      return `${section}${excerpt}`;
    })
    .join(" ");
}

function buildSummary(packet: ResearchPacketWithEvidence, copy: CategoryCopy) {
  const platformName = packet.platform_name ?? "This platform";
  const source = packet.source_url ? "The linked official source" : "The official source in this packet";
  return `${source} contains ${copy.summaryFocus} for ${platformName}. If ${platformName} is part of a critical operating stack, that language may affect account access, payouts, or response planning before a business can improvise a fallback.`;
}

function buildWhyItMatters(packet: ResearchPacketWithEvidence, copy: CategoryCopy) {
  const platformName = packet.platform_name ?? "the platform";
  return `${copy.whyItMatters} Operators using ${platformName} as a primary rail should prepare the response path before an incident depends on it.`;
}

function scoreDraftConfidence(packet: ResearchPacketWithEvidence) {
  const evidenceCount = packet.evidence.length;
  const score = Math.round(
    Math.max(
      20,
      Math.min(
        95,
        packet.confidence_score * 0.7 + evidenceCount * 4 - packet.noise_score * 0.2,
      ),
    ),
  );

  return score;
}

export class LocalTemplateEditorialAIProvider implements EditorialAIProvider {
  readonly name = "LocalTemplateEditorialAIProvider";

  async generateDraft(
    input: EditorialDraftGenerationInput,
  ): Promise<EditorialDraftTemplateOutput> {
    const { packet } = input;
    const copy = getCategoryCopy(packet);
    const platformName = packet.platform_name ?? "Platform";

    return {
      title: `${platformName} ${copy.titleSuffix}`,
      summary: buildSummary(packet, copy),
      who_is_affected: copy.audience,
      why_it_matters: buildWhyItMatters(packet, copy),
      survival_actions: copy.actions,
      checklist_items: copy.checklist,
      backup_options: copy.backupOptions,
      evidence_summary: selectEvidenceSummary(packet),
      ai_confidence: scoreDraftConfidence(packet),
    };
  }
}
