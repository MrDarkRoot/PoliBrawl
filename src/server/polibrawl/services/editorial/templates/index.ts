import type { EditorialDraftType } from "@/types/polibrawl";

import { platformSurvivalGuideTemplate } from "@/server/polibrawl/services/editorial/templates/platform-survival-guide";
import { policyChangeSummaryTemplate } from "@/server/polibrawl/services/editorial/templates/policy-change-summary";
import { redFlagAnalysisTemplate } from "@/server/polibrawl/services/editorial/templates/red-flag-analysis";
import type { EditorialTemplateDefinition } from "@/server/polibrawl/services/editorial/templates/shared";

const templates: Record<EditorialDraftType, EditorialTemplateDefinition> = {
  platform_survival_guide: platformSurvivalGuideTemplate,
  red_flag_analysis: redFlagAnalysisTemplate,
  policy_change_summary: policyChangeSummaryTemplate,
};

export function getEditorialTemplate(draftType: EditorialDraftType) {
  return templates[draftType];
}

export const editorialTemplates = Object.values(templates);
