import type { ResearchPacketWithEvidence, Uuid } from "@/types/polibrawl";

import type { EditorialDraftTemplateOutput } from "@/server/polibrawl/services/editorial/templates/shared";
import type { EditorialTemplateDefinition } from "@/server/polibrawl/services/editorial/templates/shared";

export type EditorialDraftGenerationInput = {
  packet: ResearchPacketWithEvidence;
  evidenceReferenceIds: Uuid[];
  template: EditorialTemplateDefinition;
};

export interface EditorialAIProvider {
  readonly name: string;
  generateDraft(
    input: EditorialDraftGenerationInput,
  ): Promise<EditorialDraftTemplateOutput>;
}
