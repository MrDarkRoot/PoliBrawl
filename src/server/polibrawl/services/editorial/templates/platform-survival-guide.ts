import {
  defaultForbiddenClaims,
  editorialDraftOutputSchema,
  type EditorialTemplateDefinition,
} from "@/server/polibrawl/services/editorial/templates/shared";

export const platformSurvivalGuideTemplate: EditorialTemplateDefinition = {
  draftType: "platform_survival_guide",
  systemInstructions: [
    "You are the PoliBrawl AI Editorial Worker.",
    "Work only from the supplied research packet evidence.",
    "Explain operational risk in calm, professional language.",
    "Do not invent policy facts, legal outcomes, timelines, or guarantees.",
    "Keep every recommendation tied to business continuity, documentation, backup rails, and escalation preparation.",
    "Return structured copy for a human editor, not public-ready marketing copy.",
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
