/**
 * category-editorial-templates.ts
 *
 * Sprint 10.5 — Editorial Intelligence Calibration
 *
 * Category-aware editorial templates that define:
 * - Required reasoning for each risk category
 * - Recommended section structures
 * - Forbidden claims specific to the category
 * - Minimum evidence requirements
 * - Action-writing rules
 * - Confidence deductions
 *
 * These templates work together with the context enrichment service to drive
 * the calibrated generation workflow.
 */

// ─── Category Template Type ───────────────────────────────────────────────────

export type CategoryEditorialTemplate = {
  /** The risk category this template applies to */
  category: string;
  /** Human-readable display name for admin UI */
  displayName: string;
  /** Required questions the draft must address */
  requiredReasoningQuestions: string[];
  /** Recommended section order (used to guide generation) */
  recommendedSectionOrder: string[];
  /** Forbidden claims specific to this category */
  forbiddenClaims: string[];
  /** Minimum number of evidence items required to generate a draft */
  minimumEvidenceItems: number;
  /** Rules for writing action items */
  actionWritingRules: string[];
  /** Rules for writing backup options */
  backupOptionRules: string[];
  /** Confidence deduction rules: describes what reduces the score */
  confidenceDeductions: Array<{
    condition: string;
    deductionPoints: number;
  }>;
  /** Template key stored on the draft for audit and review */
  templateKey: string;
};

// ─── Category Templates ───────────────────────────────────────────────────────

export const moneyReserveTemplate: CategoryEditorialTemplate = {
  category: "money",
  displayName: "Money / Reserve Risk",
  templateKey: "calibrated_money_v1",
  requiredReasoningQuestions: [
    "What specific funds or balance types are affected by the policy language?",
    "Is the policy wording discretionary (platform may) or conditional (platform will if)?",
    "What cash-flow or operating commitment depends on this platform balance?",
    "What records should users preserve to support a review response?",
    "What alternative payment or payout rail is realistically available?",
    "What trade-off does the backup option introduce?",
  ],
  recommendedSectionOrder: [
    "The Money Risk",
    "Who Is Exposed",
    "Why It Disrupts Operations",
    "Prepare Before It Happens",
    "Evidence Preservation",
    "Backup Rail",
    "Evidence and Limits",
  ],
  forbiddenClaims: [
    "funds will be returned",
    "funds will be released",
    "will recover",
    "guaranteed",
    "always",
    "never",
    "massive financial loss",
    "all users",
    "the platform illegally",
    "this proves",
    "analysis reveals",
    "official survival overview",
  ],
  minimumEvidenceItems: 1,
  actionWritingRules: [
    "Every action must be something the user can do now, before an incident.",
    "Actions must not assume the user has already been impacted.",
    "Avoid generic actions that apply equally to every platform.",
    "Each action should specify the business context (payroll, suppliers, settlement).",
    "Do not instruct users to contact support as the primary action — it is a secondary step.",
  ],
  backupOptionRules: [
    "Every backup option must include a real trade-off (cost, latency, compliance burden).",
    "Do not present a backup as equivalent to the primary — explain the difference.",
    "Do not suggest a backup that is unrealistic for small businesses (e.g., enterprise banking).",
  ],
  confidenceDeductions: [
    { condition: "No official evidence present", deductionPoints: 25 },
    { condition: "Evidence does not contain specific policy language", deductionPoints: 15 },
    { condition: "Draft uses generic language not tied to this platform", deductionPoints: 10 },
    { condition: "No trade-off stated in backup options", deductionPoints: 8 },
    { condition: "Actions are vague and not actionable in 24 hours", deductionPoints: 8 },
    { condition: "Unsupported certainty in fund outcome", deductionPoints: 20 },
    { condition: "Wording duplicated from another platform category draft", deductionPoints: 5 },
  ],
};

export const payoutContinuityTemplate: CategoryEditorialTemplate = {
  category: "payout",
  displayName: "Payout Continuity",
  templateKey: "calibrated_payout_v1",
  requiredReasoningQuestions: [
    "What aspect of payout timing or settlement does the policy affect?",
    "Does the evidence show a specific review trigger or is the right discretionary?",
    "What operating-cycle commitment depends on predictable settlement timing?",
    "What is the first payment that would fail if payouts moved later than expected?",
    "What alternative collection route exists and what does it cost?",
  ],
  recommendedSectionOrder: [
    "The Payout Risk",
    "Who Depends on This Timing",
    "Why a Delay Disrupts Operations",
    "Prepare Now",
    "Evidence Preservation",
    "Alternative Route",
    "Evidence and Limits",
  ],
  forbiddenClaims: [
    "payout will be restored",
    "will recover",
    "guaranteed",
    "always",
    "never",
    "this proves",
    "analysis reveals",
    "all users",
  ],
  minimumEvidenceItems: 1,
  actionWritingRules: [
    "Actions must reference the cash-flow cycle (operating payments, payroll, advertising).",
    "Actions must be preparatory — not reactive to an event that has not happened.",
    "Do not frame actions as responses to a confirmed payout delay.",
  ],
  backupOptionRules: [
    "Every backup must state its realistic settlement timeline.",
    "Trade-offs must address the operational difference, not just fees.",
  ],
  confidenceDeductions: [
    { condition: "No official evidence of payout policy language", deductionPoints: 25 },
    { condition: "Draft does not name specific cash-flow consequence", deductionPoints: 10 },
    { condition: "Generic payout language not tied to this platform", deductionPoints: 10 },
    { condition: "Backup option has no trade-off", deductionPoints: 8 },
    { condition: "Unsupported claim about payout recovery", deductionPoints: 20 },
  ],
};

export const accountRestrictionTemplate: CategoryEditorialTemplate = {
  category: "account_restriction",
  displayName: "Account Restriction",
  templateKey: "calibrated_account_restriction_v1",
  requiredReasoningQuestions: [
    "What authority does the policy reserve — temporary limitation, suspension, or full termination?",
    "What specific account functions may be affected (payments, withdrawals, access)?",
    "Which facts are uncertain and must not be stated as certain?",
    "What should users preserve before losing access to the account?",
    "What alternative workflow exists for the most critical account function?",
  ],
  recommendedSectionOrder: [
    "The Restriction Risk",
    "What Account Functions May Be Affected",
    "Who Is Most Exposed",
    "Prepare Before Access Changes",
    "Data and Evidence Preservation",
    "Alternative Workflow",
    "Evidence and Limits",
  ],
  forbiddenClaims: [
    "account will be restricted",
    "account will be suspended",
    "will recover",
    "guaranteed",
    "the platform will always",
    "this proves",
    "analysis reveals",
    "all users",
    "the platform is malicious",
    "the platform illegally",
  ],
  minimumEvidenceItems: 1,
  actionWritingRules: [
    "Actions must focus on preparation before any restriction occurs.",
    "Do not frame actions as responses to a confirmed restriction.",
    "Include specific document types: identity, business registration, fulfillment evidence.",
  ],
  backupOptionRules: [
    "Every backup must address the specific account function at risk.",
    "Trade-offs must be realistic for the size and type of typical business.",
  ],
  confidenceDeductions: [
    { condition: "No evidence of account control language", deductionPoints: 25 },
    { condition: "Draft does not identify which account functions are affected", deductionPoints: 10 },
    { condition: "Generic account risk language not specific to this platform", deductionPoints: 10 },
    { condition: "Backup option does not address the function at risk", deductionPoints: 8 },
  ],
};

export const kycVerificationTemplate: CategoryEditorialTemplate = {
  category: "kyc_verification",
  displayName: "KYC / Verification",
  templateKey: "calibrated_kyc_v1",
  requiredReasoningQuestions: [
    "What information or documents may the policy require?",
    "Which account state (new, high-volume, or post-event) is most likely to trigger verification?",
    "What delay or restriction may result from a verification request?",
    "Which documents should businesses keep current and accessible?",
    "What must not be claimed about verification approval outcomes?",
  ],
  recommendedSectionOrder: [
    "Why Verification May Be Requested",
    "Who May Be Affected",
    "Operational Consequence of a Delay",
    "Document Readiness",
    "Continuity Plan",
    "Evidence and Limits",
  ],
  forbiddenClaims: [
    "verification will be approved",
    "verification will succeed",
    "guaranteed",
    "always",
    "never",
    "this proves",
    "all users",
    "analysis reveals",
  ],
  minimumEvidenceItems: 1,
  actionWritingRules: [
    "Actions must focus on keeping verification documents current before a request arrives.",
    "Name specific document types: government ID, business registration, beneficial ownership.",
    "Do not instruct users to pre-submit documents unless the platform offers that capability.",
  ],
  backupOptionRules: [
    "Backup options must address the verification delay specifically.",
    "Trade-offs must be realistic (e.g., secondary accounts also require verification).",
  ],
  confidenceDeductions: [
    { condition: "No evidence of verification policy language", deductionPoints: 25 },
    { condition: "Draft does not name specific document types", deductionPoints: 10 },
    { condition: "Generic identity risk language not specific to this platform", deductionPoints: 10 },
    { condition: "Claims about approval outcome", deductionPoints: 20 },
  ],
};

export const disputeChargebackTemplate: CategoryEditorialTemplate = {
  category: "dispute_chargeback",
  displayName: "Dispute / Chargeback",
  templateKey: "calibrated_dispute_v1",
  requiredReasoningQuestions: [
    "What dispute or chargeback rights does the policy reserve for the platform?",
    "What evidence does a merchant need to contest a dispute?",
    "Does the evidence indicate any thresholds that trigger account review?",
    "What is the realistic window to respond to a dispute notification?",
    "What alternative exists if chargeback ratios approach thresholds?",
  ],
  recommendedSectionOrder: [
    "The Dispute Risk",
    "Who Is Most Exposed",
    "Why It Can Cascade",
    "Evidence Collection Before a Dispute Arrives",
    "Response Readiness",
    "Alternative Route",
    "Evidence and Limits",
  ],
  forbiddenClaims: [
    "you will win the dispute",
    "the dispute will be resolved in your favor",
    "guaranteed",
    "always",
    "never",
    "this proves",
    "all users",
    "analysis reveals",
  ],
  minimumEvidenceItems: 1,
  actionWritingRules: [
    "Actions must focus on evidence collection before any dispute arises.",
    "Dispute response window must be framed as the platform's stated window, not a guarantee.",
    "Do not advise legal escalation without flagging that eligibility varies.",
  ],
  backupOptionRules: [
    "Backup processors also apply chargeback policies — note this in the trade-off.",
  ],
  confidenceDeductions: [
    { condition: "No evidence of dispute policy language", deductionPoints: 25 },
    { condition: "Draft predicts dispute outcomes", deductionPoints: 20 },
    { condition: "Generic dispute risk language not specific to this platform", deductionPoints: 10 },
  ],
};

export const dataAccessTemplate: CategoryEditorialTemplate = {
  category: "data_access",
  displayName: "Data Access",
  templateKey: "calibrated_data_access_v1",
  requiredReasoningQuestions: [
    "What types of data or records does the policy address?",
    "Under what conditions may access change?",
    "Which downstream systems or workflows depend on this data?",
    "What export or backup method is realistically available?",
    "What is the recovery cost if data becomes inaccessible?",
  ],
  recommendedSectionOrder: [
    "The Data Risk",
    "Who Depends on This Data",
    "Operational Consequence",
    "Export and Backup Readiness",
    "Downstream System Continuity",
    "Evidence and Limits",
  ],
  forbiddenClaims: [
    "data will be deleted",
    "data will be lost",
    "guaranteed",
    "always",
    "never",
    "this proves",
    "all users",
    "analysis reveals",
  ],
  minimumEvidenceItems: 1,
  actionWritingRules: [
    "Actions must focus on establishing independent data backups before access changes.",
    "Specify the type of data most critical to preserve (transaction records, customer data).",
    "Do not instruct users to take actions that require platform-specific permissions they may not have.",
  ],
  backupOptionRules: [
    "Backup options must address specific data types at risk.",
    "Export maintenance overhead must be included in the trade-off.",
  ],
  confidenceDeductions: [
    { condition: "No evidence of data access policy language", deductionPoints: 25 },
    { condition: "Generic data risk language not specific to this platform", deductionPoints: 10 },
    { condition: "Claims about data deletion without evidence", deductionPoints: 20 },
  ],
};

export const terminationTemplate: CategoryEditorialTemplate = {
  category: "termination",
  displayName: "Termination / Account Closure",
  templateKey: "calibrated_termination_v1",
  requiredReasoningQuestions: [
    "What grounds does the policy list for account termination?",
    "What happens to held funds or pending payouts at termination?",
    "What records must be exported before termination becomes possible?",
    "What is the minimum viable alternative if this platform is lost entirely?",
    "What must not be said about fund recovery after termination?",
  ],
  recommendedSectionOrder: [
    "The Termination Risk",
    "What Happens to Your Funds",
    "Who Is Most Exposed",
    "Pre-Emptive Preparation",
    "Data and Evidence Export",
    "Minimum Viable Alternative",
    "Evidence and Limits",
  ],
  forbiddenClaims: [
    "termination will occur",
    "funds will be returned after termination",
    "guaranteed",
    "always",
    "never",
    "the platform illegally",
    "this proves",
    "analysis reveals",
    "all users",
    "the platform is malicious",
    "massive financial loss",
  ],
  minimumEvidenceItems: 1,
  actionWritingRules: [
    "Actions must focus on distribution of business across multiple platforms before termination risk becomes acute.",
    "Do not frame actions as post-termination responses — focus on prevention.",
    "Fund recovery after termination must never be presented as a reliable option.",
  ],
  backupOptionRules: [
    "Backup options for termination must address the entire business function lost, not just payments.",
    "Include the realistic time cost of building an equivalent alternative.",
  ],
  confidenceDeductions: [
    { condition: "No evidence of termination policy language", deductionPoints: 25 },
    { condition: "Claims about fund recovery after termination", deductionPoints: 25 },
    { condition: "Generic termination risk language not specific to this platform", deductionPoints: 10 },
    { condition: "Does not address the platform concentration risk", deductionPoints: 8 },
  ],
};

export const appealEscalationTemplate: CategoryEditorialTemplate = {
  category: "appeal_escalation",
  displayName: "Appeal / Escalation",
  templateKey: "calibrated_appeal_v1",
  requiredReasoningQuestions: [
    "What appeal or review processes does the policy describe?",
    "What evidence would most likely support a successful appeal?",
    "What external escalation route, if any, may apply?",
    "What operational continuity plan should run in parallel with the appeal?",
    "What must not be predicted about appeal outcomes?",
  ],
  recommendedSectionOrder: [
    "The Appeal Path",
    "What You Will Need",
    "Building Your Evidence Package",
    "External Escalation Options",
    "Operational Continuity During the Appeal",
    "Evidence and Limits",
  ],
  forbiddenClaims: [
    "appeal will succeed",
    "appeal will be resolved in your favor",
    "guaranteed",
    "always",
    "never",
    "this proves",
    "all users",
    "analysis reveals",
    "the platform illegally",
  ],
  minimumEvidenceItems: 1,
  actionWritingRules: [
    "Actions must focus on documentation and preparation before the appeal is submitted.",
    "Do not advise legal action without explicitly noting eligibility limits.",
    "Include the operational continuity step — do not allow the appeal to be the only plan.",
  ],
  backupOptionRules: [
    "Backup options must run in parallel with the appeal, not after it.",
    "Trade-offs must acknowledge that activating a backup may affect appeal leverage.",
  ],
  confidenceDeductions: [
    { condition: "No evidence of appeal process language", deductionPoints: 25 },
    { condition: "Predicts appeal success", deductionPoints: 25 },
    { condition: "Generic appeal language not specific to this platform", deductionPoints: 10 },
    { condition: "Does not include a parallel continuity plan", deductionPoints: 8 },
  ],
};

// ─── Template Registry ────────────────────────────────────────────────────────

const categoryTemplateRegistry: Record<string, CategoryEditorialTemplate> = {
  money: moneyReserveTemplate,
  payout: payoutContinuityTemplate,
  account_restriction: accountRestrictionTemplate,
  kyc_verification: kycVerificationTemplate,
  dispute_chargeback: disputeChargebackTemplate,
  data_access: dataAccessTemplate,
  termination: terminationTemplate,
  appeal_escalation: appealEscalationTemplate,
};

/**
 * Resolve the category-specific editorial template for a given risk category.
 * Falls back to the money/reserve template (most broadly applicable) if no
 * specific template exists for this category.
 *
 * Returns the template and a flag indicating whether a specific match was found.
 */
export function getCategoryEditorialTemplate(category: string): {
  template: CategoryEditorialTemplate;
  isExactMatch: boolean;
} {
  const template = categoryTemplateRegistry[category];

  if (template) {
    return { template, isExactMatch: true };
  }

  // Legacy category name mapping (for backward compatibility with Sprint 10 data)
  const legacyMappings: Record<string, string> = {
    account: "account_restriction",
    kyc: "kyc_verification",
    appeal: "appeal_escalation",
    dispute: "dispute_chargeback",
    data_saas: "data_access",
    api: "data_access",
    legal: "account_restriction",
  };

  const mappedKey = legacyMappings[category];
  if (mappedKey) {
    const mappedTemplate = categoryTemplateRegistry[mappedKey];
    if (mappedTemplate) {
      return { template: mappedTemplate, isExactMatch: false };
    }
  }

  return { template: moneyReserveTemplate, isExactMatch: false };
}

export const allCategoryTemplates = Object.values(categoryTemplateRegistry);
