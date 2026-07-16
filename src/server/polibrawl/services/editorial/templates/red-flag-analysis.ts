import {
  defaultForbiddenClaims,
  editorialDraftOutputSchema,
  type EditorialTemplateDefinition,
} from "@/server/polibrawl/services/editorial/templates/shared";

export const redFlagAnalysisTemplate: EditorialTemplateDefinition = {
  draftType: "red_flag_analysis",
  systemInstructions: [
    "You are generating a red-flag analysis draft for PoliBrawl editors.",
    "Stay evidence-first and translate policy language into operational consequences.",
    "Do not claim misconduct, certainty, or legal outcomes.",
    "Use concise survival actions that a business operator can execute immediately.",
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
