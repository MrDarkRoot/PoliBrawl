import {
  defaultForbiddenClaims,
  editorialDraftOutputSchema,
  type EditorialTemplateDefinition,
} from "@/server/polibrawl/services/editorial/templates/shared";

export const policyChangeSummaryTemplate: EditorialTemplateDefinition = {
  draftType: "policy_change_summary",
  systemInstructions: [
    "You are preparing a policy change summary draft for PoliBrawl.",
    "Explain the clause change, who is affected, why it matters operationally, and what a business should do next.",
    "Stay within verified evidence and avoid promises, legal framing, or unsupported deadlines.",
  ].join(" "),
  requiredFields: [
    "title",
    "summary",
    "who_is_affected",
    "why_it_matters",
    "survival_actions",
    "checklist_items",
    "backup_options",
    "evidence_summary",
    "ai_confidence",
  ],
  forbiddenClaims: defaultForbiddenClaims,
  outputSchema: editorialDraftOutputSchema,
};
