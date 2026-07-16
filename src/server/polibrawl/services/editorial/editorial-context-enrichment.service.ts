/**
 * editorial-context-enrichment.service.ts
 *
 * Sprint 10.5 — Editorial Intelligence Calibration
 *
 * Transforms a raw research packet into a richer editorial context object.
 * This enrichment is purely derived from official evidence, platform metadata,
 * and structured risk category definitions. It does NOT invent facts.
 *
 * The enriched context is fed into category-specific editorial templates and
 * the editorial critic before any draft is persisted.
 */

import type {
  ResearchPacketEvidence,
  ResearchPacketWithEvidence,
} from "@/types/polibrawl";

// ─── Enriched Context Types ───────────────────────────────────────────────────

export type PlatformContext = {
  platformName: string;
  platformType: string;
  businessModel: string;
  primaryOperationalRole: string;
  typicalDependentUsers: string[];
  criticalDependencyAreas: string[];
};

export type RiskContext = {
  riskCategory: string;
  affectedAsset: string;
  affectedWorkflow: string;
  likelyOperationalInterruption: string;
  dependencyImpact: string;
  potentialContinuityConcern: string;
};

export type EvidenceContext = {
  strongestExcerpts: {
    excerpt: string;
    sectionHint: string | null;
    sourceUrl: string | null;
    confidenceScore: number;
    noiseScore: number;
  }[];
  totalEvidenceItems: number;
  evidenceStrength: "strong" | "moderate" | "weak";
  evidenceLimitations: string[];
  unsupportedInferences: string[];
};

export type UserContext = {
  likelyAffectedGroups: string[];
  preconditions: string[];
  dependencyAssumptions: string[];
  usersMayNotBeAffected: string[];
};

export type ActionContext = {
  preparationActions: string[];
  evidencePreservationActions: string[];
  continuityActions: string[];
  escalationActionsIfSupported: string[];
  backupStrategyConstraints: string[];
};

export type EnrichedEditorialContext = {
  platform: PlatformContext;
  risk: RiskContext;
  evidence: EvidenceContext;
  user: UserContext;
  action: ActionContext;
  /** Derived overall packet summary for template use */
  packetSummary: string | null;
  /** Raw category from the research packet — used for template selection */
  rawCategory: string;
};

// ─── Platform Metadata Registry ──────────────────────────────────────────────

type PlatformMetadata = {
  type: string;
  businessModel: string;
  primaryOperationalRole: string;
  typicalDependentUsers: string[];
  criticalDependencyAreas: string[];
};

/**
 * Editorially configured platform metadata.
 * Keys are lowercase platform slugs or names.
 * Add new platforms here as they are onboarded.
 */
const platformMetadataRegistry: Record<string, PlatformMetadata> = {
  paypal: {
    type: "Payment Processor and Digital Wallet",
    businessModel: "Transaction fees on payments, currency conversion, and merchant services",
    primaryOperationalRole:
      "Primary payment collection, payout processing, and fund storage for millions of businesses and freelancers",
    typicalDependentUsers: [
      "Freelancers receiving client payments",
      "E-commerce merchants processing customer payments",
      "Independent contractors using PayPal as their primary payout rail",
      "Small businesses storing operating capital in PayPal balances",
      "International sellers relying on PayPal for cross-border transactions",
    ],
    criticalDependencyAreas: [
      "Balance access and fund availability",
      "Payout timing and settlement windows",
      "Account verification and identity review",
      "Dispute and chargeback handling",
      "Business account continuity and access controls",
    ],
  },
  stripe: {
    type: "Payment Processing API and Platform",
    businessModel: "Per-transaction fees, platform subscriptions, and managed services",
    primaryOperationalRole:
      "API-driven payment processing, subscription billing, and payout infrastructure",
    typicalDependentUsers: [
      "Software businesses and SaaS operators processing subscriptions",
      "Platforms running marketplaces with third-party sellers",
      "Developers whose products depend on Stripe API access",
      "Businesses with payouts to contractors or sellers via Stripe Connect",
    ],
    criticalDependencyAreas: [
      "API access and integration continuity",
      "Payout and Connect transfer timing",
      "Account review and identity verification",
      "Chargeback and dispute outcomes",
      "Platform account and sub-account management",
    ],
  },
  fiverr: {
    type: "Freelance Services Marketplace",
    businessModel: "Service fees on completed orders, promoted listings",
    primaryOperationalRole:
      "Primary income source and client acquisition channel for freelancers",
    typicalDependentUsers: [
      "Full-time freelancers earning primary income on the platform",
      "Service providers who built their reputation and ratings on Fiverr",
      "Buyers whose supplier relationships are locked in Fiverr accounts",
    ],
    criticalDependencyAreas: [
      "Account standing and seller levels",
      "Earnings access and payout scheduling",
      "Dispute and order cancellation policies",
      "Review and reputation system integrity",
    ],
  },
  upwork: {
    type: "Freelance Talent Marketplace",
    businessModel: "Service fees, contract facilitation, and enterprise subscriptions",
    primaryOperationalRole:
      "Primary client sourcing, contract management, and income channel for freelancers",
    typicalDependentUsers: [
      "Freelancers whose primary income flows through Upwork contracts",
      "Agencies managing multiple contractors through Upwork",
      "Clients with ongoing contractor relationships on Upwork",
    ],
    criticalDependencyAreas: [
      "Contract and payment security",
      "Account standing and Top Rated status",
      "Earnings hold and release schedules",
      "Dispute resolution through Upwork",
    ],
  },
};

const defaultPlatformMetadata: PlatformMetadata = {
  type: "Online Platform",
  businessModel: "Platform-dependent fees and service charges",
  primaryOperationalRole:
    "Key operational platform for income or business workflow",
  typicalDependentUsers: [
    "Businesses relying on the platform for revenue or operations",
    "Professionals using the platform as a primary income source",
  ],
  criticalDependencyAreas: [
    "Account access and continuity",
    "Payment or payout processing",
    "Operational workflow continuity",
  ],
};

function resolvePlatformMetadata(platformName: string | undefined): PlatformMetadata {
  if (!platformName) return defaultPlatformMetadata;
  const key = platformName.toLowerCase().trim();
  return platformMetadataRegistry[key] ?? defaultPlatformMetadata;
}

// ─── Category Risk Metadata Registry ─────────────────────────────────────────

type CategoryRiskMetadata = {
  affectedAsset: string;
  affectedWorkflow: string;
  likelyOperationalInterruption: string;
  dependencyImpact: string;
  potentialContinuityConcern: string;
  likelyAffectedGroups: string[];
  preconditions: string[];
  dependencyAssumptions: string[];
  usersMayNotBeAffected: string[];
  preparationActions: string[];
  evidencePreservationActions: string[];
  continuityActions: string[];
  escalationActionsIfSupported: string[];
  backupStrategyConstraints: string[];
  evidenceLimitations: string[];
  unsupportedInferences: string[];
};

const categoryRiskRegistry: Record<string, CategoryRiskMetadata> = {
  money: {
    affectedAsset: "Account balances, held funds, and reserve accounts",
    affectedWorkflow: "Cash-flow operations, payroll, and supplier payments",
    likelyOperationalInterruption:
      "Delayed or restricted access to funds currently held by the platform",
    dependencyImpact:
      "High for businesses that rely on platform balances for operating capital",
    potentialContinuityConcern:
      "Working capital shortfall if funds are held longer than expected",
    likelyAffectedGroups: [
      "Businesses storing operating capital in platform accounts",
      "Operators who rely on rapid settlement to meet payroll or supplier commitments",
      "Sellers whose revenue flows primarily through the platform",
    ],
    preconditions: [
      "Significant balance held in the platform account",
      "Cash-flow commitments tied to predictable fund access",
    ],
    dependencyAssumptions: [
      "The business uses this platform as a primary fund storage or transit account",
      "Settlement timing directly affects near-term operating payments",
    ],
    usersMayNotBeAffected: [
      "Users who withdraw funds immediately after each transaction",
      "Businesses with no near-term cash commitments tied to this balance",
    ],
    preparationActions: [
      "Map which cash commitments depend on this platform in the next 14 days.",
      "Calculate the maximum hold period your business can absorb without impacting payroll, suppliers, or operations.",
      "Review whether your platform account balance exceeds what is immediately needed for operations.",
    ],
    evidencePreservationActions: [
      "Export recent transaction history and settlement records dated and timestamped.",
      "Preserve invoices, delivery confirmations, and customer communications that support transaction legitimacy.",
      "Save copies of any official notices, case IDs, or platform communication about hold or reserve conditions.",
    ],
    continuityActions: [
      "Keep at least one secondary payout or payment rail active and tested before you need it.",
      "Notify key suppliers or contractors of potential payment timing risk before it becomes urgent.",
    ],
    escalationActionsIfSupported: [
      "If funds are held, document the hold start date and follow the platform's official review process.",
      "Check whether an independent dispute or financial regulator route is available in your jurisdiction.",
    ],
    backupStrategyConstraints: [
      "A secondary payment rail requires its own onboarding, compliance, and fee structure — factor this into the transition cost.",
      "Bank transfer fallbacks usually involve slower settlement times than platform payments.",
    ],
    evidenceLimitations: [
      "Policy language describes authority; the frequency and triggers of actual holds are not disclosed.",
      "The evidence does not specify which transaction types or account ages are most likely to trigger a hold.",
    ],
    unsupportedInferences: [
      "Do not state that a hold will occur — only that policy permits holds under described conditions.",
      "Do not predict hold durations — the evidence does not disclose typical timelines.",
      "Do not state that funds will be returned — evidence does not guarantee this.",
    ],
  },

  payout: {
    affectedAsset: "Payout schedule, settlement funds, and withdrawal access",
    affectedWorkflow: "Payout processing and cash conversion timing",
    likelyOperationalInterruption:
      "Extended payout review window or temporary withdrawal restriction",
    dependencyImpact:
      "High for businesses whose operating cycle depends on predictable settlement windows",
    potentialContinuityConcern:
      "Operating cash-flow gap if payouts are delayed during a review",
    likelyAffectedGroups: [
      "Businesses with payout-dependent payroll or supplier obligations",
      "Freelancers whose living expenses depend on regular withdrawals",
      "Operators with advertising or inventory spend tied to settlement timing",
    ],
    preconditions: [
      "Payout timing is critical to near-term operating commitments",
      "The business has limited reserve outside the platform",
    ],
    dependencyAssumptions: [
      "Settlement timing is used as an operational cash-flow input",
    ],
    usersMayNotBeAffected: [
      "Businesses with adequate external reserve to absorb a delayed settlement cycle",
      "Operators who do not rely on predictable settlement windows for operating payments",
    ],
    preparationActions: [
      "Model the effect of a delayed payout cycle on near-term operating payments.",
      "Identify which financial commitments would fail first if settlement moves later than expected.",
      "Test a backup payout route before relying on it under pressure.",
    ],
    evidencePreservationActions: [
      "Export payout history and settlement records.",
      "Save the platform's official payout policy at current date for reference.",
      "Document any platform communication about payout timing changes.",
    ],
    continuityActions: [
      "Maintain a financial buffer covering at least one delayed settlement cycle.",
      "Keep an alternative payout or collection route active and verified.",
    ],
    escalationActionsIfSupported: [
      "Use the platform's official payout support channel if a specific payout is delayed.",
    ],
    backupStrategyConstraints: [
      "Alternate payout providers have their own settlement timelines — verify before treating them as immediate alternatives.",
      "Invoice-based collection requires payment terms negotiation with clients.",
    ],
    evidenceLimitations: [
      "Policy language reserves the right to review payouts; it does not specify trigger conditions.",
      "Typical payout review durations are not disclosed in the evidence.",
    ],
    unsupportedInferences: [
      "Do not state that a payout will be delayed — only that policy permits review.",
      "Do not claim funds will be returned in any particular timeframe.",
    ],
  },

  account_restriction: {
    affectedAsset: "Account access, permissions, and operational controls",
    affectedWorkflow: "Account management, customer service, and transaction processing",
    likelyOperationalInterruption:
      "Partial or full restriction of account functions during a platform review",
    dependencyImpact:
      "Critical for businesses whose entire operation routes through a single account",
    potentialContinuityConcern:
      "Inability to process transactions, respond to disputes, or access records if access is restricted",
    likelyAffectedGroups: [
      "Businesses operating through a single account without a continuity backup",
      "Teams that require uninterrupted access to manage orders, disputes, or customer communications",
    ],
    preconditions: [
      "The account is the primary operational channel for the business",
      "No secondary account or equivalent system exists",
    ],
    dependencyAssumptions: [
      "All primary transactions and communications flow through this one account",
    ],
    usersMayNotBeAffected: [
      "Businesses that have already distributed operations across multiple platforms",
      "Operators with manual fallback workflows that do not depend on the account",
    ],
    preparationActions: [
      "Identify which account functions are most critical and which would fail first if access is limited.",
      "Pre-stage the documents most likely to support a platform account review.",
      "Route critical customer communication through systems that exist outside the affected account.",
    ],
    evidencePreservationActions: [
      "Export account activity, order history, and settlement records before you need them.",
      "Save current identity, business registration, and ownership documentation.",
      "Preserve customer service communications and fulfillment evidence for recent transactions.",
    ],
    continuityActions: [
      "Test at least one alternative payment or operational route before depending on it.",
      "Ensure critical contacts can reach you through channels outside the platform.",
    ],
    escalationActionsIfSupported: [
      "Follow the platform's official account review process if a restriction is applied.",
      "Document all platform communications with timestamps for a potential escalation.",
    ],
    backupStrategyConstraints: [
      "A secondary operating account requires independent compliance, fee agreements, and customer communication.",
      "Manual workflows are viable for short disruptions but do not scale.",
    ],
    evidenceLimitations: [
      "Policy reserves the right to restrict accounts; it does not disclose typical triggers or durations.",
    ],
    unsupportedInferences: [
      "Do not state that an account restriction will occur — only that policy permits it.",
      "Do not predict account recovery timelines.",
      "Do not characterize the platform's intent as punitive or arbitrary.",
    ],
  },

  kyc_verification: {
    affectedAsset: "Account verification status and associated operational permissions",
    affectedWorkflow: "Payment processing, withdrawal access, and account operations",
    likelyOperationalInterruption:
      "Paused or degraded account capabilities pending completion of a verification request",
    dependencyImpact:
      "High for businesses where a single account holds all verification credentials",
    potentialContinuityConcern:
      "Inability to process payments or withdraw funds during an extended verification review",
    likelyAffectedGroups: [
      "Businesses asked to re-verify identity, business ownership, or operating activity",
      "Teams whose payment continuity depends on a single verified account",
      "Operators who have not kept verification documents current",
    ],
    preconditions: [
      "The platform has requested or may request identity or business verification",
      "Payment or account operations are gated on verified status",
    ],
    dependencyAssumptions: [
      "The business relies on a verified account for all payment processing",
    ],
    usersMayNotBeAffected: [
      "Accounts that have recently completed verification with no changes to business structure",
      "Low-volume accounts operating below thresholds that trigger enhanced verification",
    ],
    preparationActions: [
      "Centralize current identity, business registration, and ownership documents in one accessible location.",
      "Assign a single responsible person for platform verification requests and deadlines.",
      "Review whether all current business information on the platform accurately reflects your current structure.",
    ],
    evidencePreservationActions: [
      "Store government-issued ID and business registration documents with current expiry dates.",
      "Keep beneficial ownership and business address records updated.",
      "Save any prior platform verification acceptances for reference.",
    ],
    continuityActions: [
      "Maintain a secondary payment route in case verification delays impact primary processing.",
      "Monitor account status notifications so verification requests are not missed.",
    ],
    escalationActionsIfSupported: [
      "Respond to verification requests within the platform's stated deadline.",
      "If verification is disputed, follow the official support escalation path.",
    ],
    backupStrategyConstraints: [
      "Secondary merchant accounts require their own verification and compliance process.",
      "Bank-transfer fallbacks have lower automation and may require client payment term changes.",
    ],
    evidenceLimitations: [
      "Policy specifies what information may be requested; it does not disclose verification approval rates or typical review durations.",
    ],
    unsupportedInferences: [
      "Do not claim that a specific business will be asked to verify — only that policy permits verification requests.",
      "Do not predict verification outcomes.",
    ],
  },

  dispute_chargeback: {
    affectedAsset: "Transaction funds, account standing, and chargeback ratios",
    affectedWorkflow: "Dispute resolution, chargeback response, and customer refund handling",
    likelyOperationalInterruption:
      "Elevated chargeback rates or unresolved disputes may trigger account review or reserves",
    dependencyImpact:
      "High for businesses with significant transaction volume vulnerable to buyer disputes",
    potentialContinuityConcern:
      "Compounded chargeback costs and potential account restriction if dispute ratios exceed thresholds",
    likelyAffectedGroups: [
      "E-commerce merchants with high transaction volume",
      "Service providers whose work completion is difficult to document",
      "Businesses in high-chargeback categories such as digital goods or travel",
    ],
    preconditions: [
      "The business processes customer payments through the platform",
      "Dispute or chargeback rates may approach platform thresholds",
    ],
    dependencyAssumptions: [
      "Customer disputes are handled through the platform's native dispute system",
    ],
    usersMayNotBeAffected: [
      "Businesses with strong delivery documentation and low historical dispute rates",
      "Operators in categories with low chargeback rates",
    ],
    preparationActions: [
      "Establish a clear evidence-collection workflow for every transaction: delivery proof, customer communication, and fulfillment records.",
      "Monitor your dispute and chargeback rate against the platform's disclosed thresholds.",
      "Respond to dispute notifications within the platform's stated response windows.",
    ],
    evidencePreservationActions: [
      "Save transaction records, fulfillment evidence, and customer communication for every order.",
      "Export dispute history periodically to monitor trend lines.",
    ],
    continuityActions: [
      "Keep a secondary payment processor available if chargeback ratios threaten account standing.",
    ],
    escalationActionsIfSupported: [
      "Use the platform's official dispute response channel and document every step.",
    ],
    backupStrategyConstraints: [
      "Secondary payment processors will also apply their own chargeback threshold policies.",
    ],
    evidenceLimitations: [
      "Policy discloses dispute procedures; it does not reveal which dispute outcomes favor merchants.",
    ],
    unsupportedInferences: [
      "Do not state that a business will win a dispute — evidence does not support that.",
      "Do not characterize dispute processes as systematically unfair.",
    ],
  },

  data_access: {
    affectedAsset: "Account data, transaction records, and operational history",
    affectedWorkflow: "Reporting, customer service, and downstream system integrations",
    likelyOperationalInterruption:
      "Loss of access to operational data if account is limited before an export is complete",
    dependencyImpact:
      "High for businesses that rely on the platform for data storage rather than maintaining independent records",
    potentialContinuityConcern:
      "Inability to reconstruct records for accounting, compliance, or customer service if access changes",
    likelyAffectedGroups: [
      "Businesses that rely on platform data for accounting or reporting",
      "Teams whose customer service depends on platform transaction history",
      "Operators with downstream system integrations pulling platform data",
    ],
    preconditions: [
      "Critical operational data exists primarily or exclusively within the platform",
    ],
    dependencyAssumptions: [
      "No independent backup of platform data is currently maintained",
    ],
    usersMayNotBeAffected: [
      "Businesses that routinely export and store platform data independently",
      "Operators with complete records outside the platform",
    ],
    preparationActions: [
      "Identify which data would be hardest to reconstruct if access changed suddenly.",
      "Establish a repeatable export routine for critical records.",
      "Document which downstream systems depend on live platform data access.",
    ],
    evidencePreservationActions: [
      "Export account data on a scheduled basis and store it independently.",
      "Verify who owns the export process and where exported data is stored.",
    ],
    continuityActions: [
      "Test that downstream tools or reports function from exported data.",
      "Maintain a secondary workflow for generating critical records if access changes.",
    ],
    escalationActionsIfSupported: [],
    backupStrategyConstraints: [
      "Scheduled exports require maintenance and storage — factor this into operational overhead.",
      "A secondary system requires data migration and reconciliation before it can be relied on.",
    ],
    evidenceLimitations: [
      "Terms describe data access policies; they do not specify under what conditions access would be restricted.",
    ],
    unsupportedInferences: [
      "Do not claim that data will be lost — only that access may change under described conditions.",
    ],
  },

  termination: {
    affectedAsset: "Account existence, all associated data, and all funds held",
    affectedWorkflow: "All platform operations, payment processing, and data access",
    likelyOperationalInterruption:
      "Permanent loss of all platform access including pending balances",
    dependencyImpact:
      "Critical — termination eliminates the platform as an operational channel entirely",
    potentialContinuityConcern:
      "Total loss of a primary income or operational channel with uncertain fund recovery path",
    likelyAffectedGroups: [
      "Businesses whose primary income or operations depend on this platform",
      "Operators with significant balances or pending payouts at time of termination",
    ],
    preconditions: [
      "The account is the primary business channel",
      "No equivalent backup is operational",
    ],
    dependencyAssumptions: [
      "The business has not pre-staged an equivalent alternative channel",
    ],
    usersMayNotBeAffected: [
      "Businesses already operating across multiple platforms with equivalent capability",
    ],
    preparationActions: [
      "Treat this platform as one of several channels — never allow it to be the only operational route.",
      "Pre-stage the documentation that would be most useful if an account review escalated to termination.",
      "Export all critical data, records, and evidence before any adverse review begins.",
    ],
    evidencePreservationActions: [
      "Export complete account data, transaction history, and customer records.",
      "Preserve all platform communications with timestamps.",
    ],
    continuityActions: [
      "Maintain at least one fully operational alternative for every function this platform performs.",
      "Notify key customers of your alternative contact methods now, before you might need them.",
    ],
    escalationActionsIfSupported: [
      "If an account is terminated, document the sequence of events and preserve the official termination notice.",
      "Check whether an independent regulatory or financial dispute route is available in your jurisdiction.",
    ],
    backupStrategyConstraints: [
      "A fully equivalent backup channel requires onboarding, compliance, reputation, and customer migration.",
      "Recovery of funds after termination is uncertain — do not depend on it for continuity planning.",
    ],
    evidenceLimitations: [
      "Policy discloses the platform's termination rights; it does not specify what triggers termination in practice.",
    ],
    unsupportedInferences: [
      "Do not state that a business will be terminated — only that policy permits termination under described conditions.",
      "Do not predict fund recovery after termination.",
      "Do not characterize the platform's termination practices as arbitrary without specific evidence.",
    ],
  },

  appeal_escalation: {
    affectedAsset: "Account decisions, held funds, and dispute outcomes",
    affectedWorkflow: "Appeal or review processes following an adverse platform decision",
    likelyOperationalInterruption:
      "Delay in resolving an adverse decision while the appeal window remains open",
    dependencyImpact:
      "Moderate — outcome depends on quality of documentation and appeal path availability",
    potentialContinuityConcern:
      "Operating under a restricted or adverse account state while an appeal is unresolved",
    likelyAffectedGroups: [
      "Businesses that have received an adverse platform decision and want to challenge it",
      "Operators who need a documented escalation path during a dispute or restriction",
    ],
    preconditions: [
      "An adverse platform decision has occurred or is anticipated",
      "An appeal or review path is available according to platform policy",
    ],
    dependencyAssumptions: [
      "The business has documented evidence to support the appeal",
    ],
    usersMayNotBeAffected: [
      "Businesses that have not received an adverse decision",
    ],
    preparationActions: [
      "Document a dated timeline of the issue and all platform responses with timestamps.",
      "Organize supporting evidence in the order a reviewer would most likely need it.",
      "Identify whether an external escalation route — such as a financial regulator or ombudsman — may apply.",
    ],
    evidencePreservationActions: [
      "Save all official notices, case IDs, and timestamps.",
      "Preserve transaction, fulfillment, and customer communication evidence together in one location.",
    ],
    continuityActions: [
      "Do not wait for the appeal outcome to activate a backup operational route.",
      "Maintain business continuity through alternative channels while the appeal is pending.",
    ],
    escalationActionsIfSupported: [
      "If the platform appeal is unsuccessful, check whether a financial regulator or independent dispute body has jurisdiction.",
    ],
    backupStrategyConstraints: [
      "External escalation routes may have eligibility limits, fees, and processing times.",
      "A backup operational route reduces appeal leverage — weigh this decision carefully.",
    ],
    evidenceLimitations: [
      "Policy discloses what appeal processes are available; it does not disclose appeal success rates.",
    ],
    unsupportedInferences: [
      "Do not predict appeal outcomes.",
      "Do not advise the user that an appeal will succeed.",
    ],
  },
};

const defaultCategoryRiskMetadata: CategoryRiskMetadata = {
  affectedAsset: "Account operations and associated business workflows",
  affectedWorkflow: "Primary business operations on the platform",
  likelyOperationalInterruption: "Disruption to normal platform operations",
  dependencyImpact: "Depends on degree of business dependence on this platform",
  potentialContinuityConcern:
    "Inability to continue operations at normal capacity if access changes",
  likelyAffectedGroups: [
    "Businesses using this platform as a primary operational channel",
  ],
  preconditions: ["Significant business activity routed through this platform"],
  dependencyAssumptions: [
    "The business has meaningful operational or financial dependence on this platform",
  ],
  usersMayNotBeAffected: [
    "Businesses using this platform only in a secondary or supplementary role",
  ],
  preparationActions: [
    "Identify which workflows would fail first if platform access changed.",
    "Gather the documents most likely to be needed during a platform review.",
    "Prepare at least one backup route for critical operations.",
  ],
  evidencePreservationActions: [
    "Export current account records and transaction history.",
    "Save official platform communications with timestamps.",
  ],
  continuityActions: [
    "Test a backup workflow before you need it under pressure.",
    "Ensure key contacts can reach you through channels outside this platform.",
  ],
  escalationActionsIfSupported: [
    "Follow the platform's official review or support escalation process.",
  ],
  backupStrategyConstraints: [
    "A backup platform or workflow requires its own setup, compliance, and transition time.",
  ],
  evidenceLimitations: [
    "Policy discloses the platform's rights; it does not disclose typical enforcement patterns.",
  ],
  unsupportedInferences: [
    "Do not predict specific enforcement actions without direct evidence.",
  ],
};

function resolveCategoryRiskMetadata(category: string): CategoryRiskMetadata {
  return categoryRiskRegistry[category] ?? defaultCategoryRiskMetadata;
}

// ─── Evidence Analysis Helpers ────────────────────────────────────────────────

function classifyEvidenceStrength(
  evidence: ResearchPacketEvidence[],
): "strong" | "moderate" | "weak" {
  if (evidence.length === 0) return "weak";
  const avgConfidence =
    evidence.reduce((sum, e) => sum + e.confidence_score, 0) / evidence.length;
  const avgNoise =
    evidence.reduce((sum, e) => sum + e.noise_score, 0) / evidence.length;

  if (avgConfidence >= 70 && avgNoise <= 30 && evidence.length >= 2) return "strong";
  if (avgConfidence >= 40 && avgNoise <= 60 && evidence.length >= 1) return "moderate";
  return "weak";
}

function selectStrongestExcerpts(evidence: ResearchPacketEvidence[], limit = 3) {
  return [...evidence]
    .sort((a, b) => {
      if (b.confidence_score !== a.confidence_score)
        return b.confidence_score - a.confidence_score;
      if (a.noise_score !== b.noise_score)
        return a.noise_score - b.noise_score;
      return a.display_order - b.display_order;
    })
    .slice(0, limit)
    .map((e) => ({
      excerpt: e.excerpt.replace(/\s+/g, " ").trim(),
      sectionHint: e.section_hint ?? null,
      sourceUrl: e.source_url ?? null,
      confidenceScore: e.confidence_score,
      noiseScore: e.noise_score,
    }));
}

// ─── Main Enrichment Function ─────────────────────────────────────────────────

/**
 * Enrich a research packet into a structured editorial context.
 *
 * All fields are derived from:
 * - The research packet itself (category, platform metadata, evidence)
 * - The editorially configured platform and category registries above
 *
 * Nothing is invented.
 */
export function enrichEditorialContext(
  packet: ResearchPacketWithEvidence,
): EnrichedEditorialContext {
  const platformName = packet.platform_name ?? "This Platform";
  const platformMeta = resolvePlatformMetadata(platformName);
  const categoryMeta = resolveCategoryRiskMetadata(packet.category);

  const platform: PlatformContext = {
    platformName,
    platformType: platformMeta.type,
    businessModel: platformMeta.businessModel,
    primaryOperationalRole: platformMeta.primaryOperationalRole,
    typicalDependentUsers: platformMeta.typicalDependentUsers,
    criticalDependencyAreas: platformMeta.criticalDependencyAreas,
  };

  const risk: RiskContext = {
    riskCategory: packet.category,
    affectedAsset: categoryMeta.affectedAsset,
    affectedWorkflow: categoryMeta.affectedWorkflow,
    likelyOperationalInterruption: categoryMeta.likelyOperationalInterruption,
    dependencyImpact: categoryMeta.dependencyImpact,
    potentialContinuityConcern: categoryMeta.potentialContinuityConcern,
  };

  const evidence: EvidenceContext = {
    strongestExcerpts: selectStrongestExcerpts(packet.evidence, 3),
    totalEvidenceItems: packet.evidence.length,
    evidenceStrength: classifyEvidenceStrength(packet.evidence),
    evidenceLimitations: categoryMeta.evidenceLimitations,
    unsupportedInferences: categoryMeta.unsupportedInferences,
  };

  const user: UserContext = {
    likelyAffectedGroups: categoryMeta.likelyAffectedGroups,
    preconditions: categoryMeta.preconditions,
    dependencyAssumptions: categoryMeta.dependencyAssumptions,
    usersMayNotBeAffected: categoryMeta.usersMayNotBeAffected,
  };

  const action: ActionContext = {
    preparationActions: categoryMeta.preparationActions,
    evidencePreservationActions: categoryMeta.evidencePreservationActions,
    continuityActions: categoryMeta.continuityActions,
    escalationActionsIfSupported: categoryMeta.escalationActionsIfSupported,
    backupStrategyConstraints: categoryMeta.backupStrategyConstraints,
  };

  return {
    platform,
    risk,
    evidence,
    user,
    action,
    packetSummary: packet.summary ?? null,
    rawCategory: packet.category,
  };
}
