import "server-only";

import {
  createEditorialDraft,
} from "@/server/polibrawl/repositories/editorial-draft.repository";
import {
  findResearchPacketWithEvidence,
} from "@/server/polibrawl/repositories/research-packet.repository";
import type { EditorialAIProvider } from "@/server/polibrawl/services/editorial/editorial-ai-provider";
import { validateEditorialAiDraftCandidate } from "@/server/polibrawl/services/editorial/editorial-ai-validator.service";
import { LocalTemplateEditorialAIProvider } from "@/server/polibrawl/services/editorial/local-template-editorial-ai-provider";
import { getEditorialTemplate } from "@/server/polibrawl/services/editorial/templates";
import type {
  CreateEditorialDraftDto,
  EditorialDraft,
  EditorialDraftType,
  ResearchPacketEvidence,
  ResearchPacketWithEvidence,
  Uuid,
} from "@/types/polibrawl";

function selectEvidenceReferences(packet: ResearchPacketWithEvidence): ResearchPacketEvidence[] {
  return [...packet.evidence]
    .sort((left, right) => {
      if (right.confidence_score !== left.confidence_score) {
        return right.confidence_score - left.confidence_score;
      }

      if (left.noise_score !== right.noise_score) {
        return left.noise_score - right.noise_score;
      }

      return left.display_order - right.display_order;
    })
    .slice(0, 3);
}

function buildDraftInsertPayload(
  packet: ResearchPacketWithEvidence,
  draftType: EditorialDraftType,
  redFlagId: Uuid | null,
  candidate: Awaited<ReturnType<EditorialAIProvider["generateDraft"]>>,
  evidenceReferenceIds: Uuid[],
): CreateEditorialDraftDto {
  return {
    platform_id: packet.platform_id,
    red_flag_id: redFlagId,
    research_packet_id: packet.id,
    draft_type: draftType,
    title: candidate.title,
    summary: candidate.summary,
    who_is_affected: candidate.who_is_affected,
    why_it_matters: candidate.why_it_matters,
    survival_actions: candidate.survival_actions,
    checklist_items: candidate.checklist_items,
    backup_options: candidate.backup_options,
    evidence_summary: candidate.evidence_summary,
    evidence_reference_ids: evidenceReferenceIds,
    ai_confidence: candidate.ai_confidence,
    status: "draft",
    reviewed_at: null,
    published_at: null,
  };
}

export type GenerateEditorialDraftInput = {
  researchPacketId: Uuid;
  draftType?: EditorialDraftType;
  redFlagId?: Uuid | null;
};

export class AiEditorialWorkerService {
  constructor(
    private readonly provider: EditorialAIProvider = new LocalTemplateEditorialAIProvider(),
  ) {}

  async generateDraft(input: GenerateEditorialDraftInput): Promise<EditorialDraft> {
    const draftType = input.draftType ?? "platform_survival_guide";
    const packet = await findResearchPacketWithEvidence(input.researchPacketId);

    if (!packet) {
      throw new Error("Research packet not found.");
    }

    if (!packet.evidence.length) {
      throw new Error("Research packet does not contain evidence excerpts.");
    }

    const template = getEditorialTemplate(draftType);
    const evidenceReferences = selectEvidenceReferences(packet);
    const evidenceReferenceIds = evidenceReferences.map((item) => item.id);
    const candidate = template.outputSchema.parse(
      await this.provider.generateDraft({
        packet,
        evidenceReferenceIds,
        template,
      }),
    );

    const validation = validateEditorialAiDraftCandidate(
      {
        ...candidate,
        evidence_reference_ids: evidenceReferenceIds,
      },
      packet.evidence.map((item) => item.id),
    );
    if (!validation.ok) {
      throw new Error(`AI editorial draft validation failed: ${validation.errors.join(" ")}`);
    }

    const created = await createEditorialDraft(
      buildDraftInsertPayload(
        packet,
        draftType,
        input.redFlagId ?? null,
        candidate,
        evidenceReferenceIds,
      ),
    );

    if (!created) {
      throw new Error("Failed to persist editorial draft.");
    }

    return created;
  }
}

export const aiEditorialWorkerService = new AiEditorialWorkerService();
