/**
 * calibrated-editorial-generation.service.ts
 *
 * Sprint 10.5 — Editorial Intelligence Calibration
 *
 * Implements the full calibrated generation workflow:
 *
 *  1. Load research packet + evidence
 *  2. Load platform context
 *  3. Determine risk category
 *  4. Enrich editorial context
 *  5. Select category template
 *  6. Generate initial draft (via calibrated provider)
 *  7. Validate schema + forbidden claims
 *  8. Run editorial critic
 *  9. Apply deterministic revision suggestions (safe rewrites only)
 * 10. Re-run validator
 * 11. Save:
 *     - editorial draft
 *     - generation context (JSONB)
 *     - critic result (JSONB)
 *     - quality evaluation (JSONB)
 *     - ai_generated revision snapshot
 *
 * The system STOPS and refuses persistence when:
 * - No official evidence exists
 * - Evidence references are invalid
 * - Unsupported guarantees are present
 * - Required sections are missing
 * - Internal metadata appears in public-facing fields
 * - Critic identifies a blocker-severity grounding failure
 *
 * Low-scoring drafts MAY be persisted in 'draft' status when:
 * - They are safe (no blockers)
 * - Evidence-grounded (at least 1 evidence item)
 * - Clearly marked for human review
 * - Not publishable
 *
 * SECURITY:
 * - Evidence text is treated as quoted data, never as instructions
 * - All AI output is validated before persistence
 * - No raw provider metadata is stored in draft fields
 * - No secrets are persisted
 */

import "server-only";

import {
  createEditorialDraft,
  updateEditorialDraft,
} from "@/server/polibrawl/repositories/editorial-draft.repository";
import { findResearchPacketWithEvidence } from "@/server/polibrawl/repositories/research-packet.repository";
import { createEditorialDraftRevision } from "@/server/polibrawl/repositories/editorial-draft-revision.repository";
import { validateEditorialAiDraftCandidate } from "@/server/polibrawl/services/editorial/editorial-ai-validator.service";
import { enrichEditorialContext } from "@/server/polibrawl/services/editorial/editorial-context-enrichment.service";
import {
  getCategoryEditorialTemplate,
} from "@/server/polibrawl/services/editorial/category-editorial-templates";
import {
  runEditorialCritic,
  type CriticResultWithQuality,
} from "@/server/polibrawl/services/editorial/editorial-critic.service";
import { CalibratedTemplateEditorialAIProvider } from "@/server/polibrawl/services/editorial/calibrated-template-editorial-ai-provider";
import { buildRevisionContentSnapshot } from "@/server/polibrawl/services/editorial/editorial-edit-distance.shared";
import { getEditorialTemplate } from "@/server/polibrawl/services/editorial/templates";
import type {
  CreateEditorialDraftDto,
  EditorialDraft,
  EditorialDraftType,
  ResearchPacketEvidence,
  ResearchPacketWithEvidence,
  Uuid,
} from "@/types/polibrawl";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CalibratedGenerationInput = {
  researchPacketId: Uuid;
  draftType?: EditorialDraftType;
  redFlagId?: Uuid | null;
};

export type CalibratedGenerationResult = {
  draft: EditorialDraft;
  criticResult: CriticResultWithQuality;
  templateKey: string;
  enrichedContextSummary: {
    platformName: string;
    category: string;
    evidenceStrength: string;
    totalEvidenceItems: number;
  };
};

// ─── Evidence Selection ───────────────────────────────────────────────────────

function selectEvidenceReferences(packet: ResearchPacketWithEvidence): ResearchPacketEvidence[] {
  return [...packet.evidence]
    .sort((a, b) => {
      if (b.confidence_score !== a.confidence_score)
        return b.confidence_score - a.confidence_score;
      if (a.noise_score !== b.noise_score)
        return a.noise_score - b.noise_score;
      return a.display_order - b.display_order;
    })
    .slice(0, 3);
}

// ─── Safe Revision Application ────────────────────────────────────────────────

/**
 * Apply deterministic, safe revisions suggested by the critic.
 *
 * SECURITY: Only safe, predictable string replacements are applied.
 * No LLM is called. No external input is trusted.
 * Evidence text is never executed as an instruction.
 */
function applyDeterministicRevisions(
  draft: Awaited<ReturnType<CalibratedTemplateEditorialAIProvider["generateDraft"]>>,
  criticResult: CriticResultWithQuality,
  platformName: string,
): typeof draft {
  let revised = { ...draft };

  for (const issue of criticResult.issues) {
    // Only apply revisions for "medium" severity or lower — high/blocker require human attention
    if (issue.severity === "high" || issue.severity === "blocker") continue;

    // Safe revision: replace generic platform references with the actual platform name
    if (issue.code === "GENERIC_PLATFORM_LANGUAGE" && platformName !== "This Platform") {
      revised = {
        ...revised,
        summary: revised.summary
          .replace(/this platform/gi, platformName)
          .replace(/the platform/gi, platformName),
        why_it_matters: revised.why_it_matters
          .replace(/this platform/gi, platformName)
          .replace(/the platform/gi, platformName),
      };
    }

    // Safe revision: remove obviously generic phrases
    if (issue.code === "GENERIC_AI_PHRASE_SIMPLY") {
      revised = {
        ...revised,
        survival_actions: revised.survival_actions.map((a) =>
          a.replace(/users should simply /gi, "Users should "),
        ),
        checklist_items: revised.checklist_items.map((c) =>
          c.replace(/simply /gi, ""),
        ),
      };
    }
  }

  return revised;
}

// ─── Calibrated Generation Service ───────────────────────────────────────────

const calibratedProvider = new CalibratedTemplateEditorialAIProvider();

/**
 * Run the full Sprint 10.5 calibrated generation workflow.
 *
 * This is the primary entry point for new draft generation.
 * The legacy AiEditorialWorkerService (Sprint 10) remains available
 * for backward compatibility.
 */
export async function generateCalibratedEditorialDraft(
  input: CalibratedGenerationInput,
): Promise<CalibratedGenerationResult> {
  const draftType = input.draftType ?? "platform_survival_guide";

  // ── Step 1: Load research packet ──────────────────────────────────────────
  const packet = await findResearchPacketWithEvidence(input.researchPacketId);
  if (!packet) {
    throw new Error("Research packet not found.");
  }

  // ── Step 2: Validate evidence ────────────────────────────────────────────
  if (!packet.evidence.length) {
    throw new Error(
      "Research packet has no evidence items. Calibrated generation requires at least one official evidence excerpt.",
    );
  }

  // ── Step 3: Enrich editorial context ─────────────────────────────────────
  const context = enrichEditorialContext(packet);

  // ── Step 4: Select category template ─────────────────────────────────────
  const { template: categoryTemplate, isExactMatch } =
    getCategoryEditorialTemplate(packet.category);
  const templateKey = categoryTemplate.templateKey;

  // ── Step 5: Get draft type template (schema validation) ──────────────────
  const draftTypeTemplate = getEditorialTemplate(draftType);

  // ── Step 6: Evidence references ──────────────────────────────────────────
  const evidenceReferences = selectEvidenceReferences(packet);
  const evidenceReferenceIds = evidenceReferences.map((e) => e.id);

  // ── Step 7: Generate initial draft ───────────────────────────────────────
  const rawCandidate = draftTypeTemplate.outputSchema.parse(
    await calibratedProvider.generateDraft({
      packet,
      evidenceReferenceIds,
      template: draftTypeTemplate,
    }),
  );

  // ── Step 8: Run editorial critic (first pass) ─────────────────────────────
  const initialCriticResult = runEditorialCritic(
    rawCandidate,
    context,
    categoryTemplate,
  ) as CriticResultWithQuality;

  // ── Step 9: Reject on blocker ─────────────────────────────────────────────
  const blockerIssues = initialCriticResult.issues.filter(
    (i) => i.severity === "blocker",
  );
  if (blockerIssues.length > 0) {
    const blockerSummary = blockerIssues
      .map((i) => `[${i.code}] ${i.message}`)
      .join("; ");
    throw new Error(
      `Calibrated draft rejected due to blocker-severity issues: ${blockerSummary}`,
    );
  }

  // ── Step 10: Apply deterministic revisions ────────────────────────────────
  const revisedCandidate = applyDeterministicRevisions(
    rawCandidate,
    initialCriticResult,
    context.platform.platformName,
  );

  // ── Step 11: Re-validate after revisions ─────────────────────────────────
  const validationResult = validateEditorialAiDraftCandidate(
    { ...revisedCandidate, evidence_reference_ids: evidenceReferenceIds },
    packet.evidence.map((e) => e.id),
  );
  if (!validationResult.ok) {
    throw new Error(
      `Draft validation failed after revisions: ${validationResult.errors.join(" ")}`,
    );
  }

  // ── Step 12: Run final critic pass ───────────────────────────────────────
  const finalCriticResult = runEditorialCritic(
    revisedCandidate,
    context,
    categoryTemplate,
  ) as CriticResultWithQuality;

  // ── Step 13: Build generation context JSONB ───────────────────────────────
  // SECURITY: No secrets, no provider credentials, no raw response dumps
  const generationContext = {
    provider: calibratedProvider.name,
    category: packet.category,
    categoryTemplateKey: templateKey,
    categoryTemplateIsExactMatch: isExactMatch,
    evidenceStrength: context.evidence.evidenceStrength,
    totalEvidenceItems: context.evidence.totalEvidenceItems,
    platformName: context.platform.platformName,
    platformType: context.platform.platformType,
    // Evidence limitations stored for review context — no raw evidence text stored here
    evidenceLimitations: context.evidence.evidenceLimitations,
    unsupportedInferences: context.evidence.unsupportedInferences,
    generatedAt: new Date().toISOString(),
  };

  // Strip qualityEvaluation from critic result before storing in critic_result field
  const { qualityEvaluation, ...criticResultForStorage } = finalCriticResult as CriticResultWithQuality & { qualityEvaluation: unknown };

  // ── Step 14: Persist the draft ────────────────────────────────────────────
  const createPayload: CreateEditorialDraftDto = {
    platform_id: packet.platform_id,
    red_flag_id: input.redFlagId ?? null,
    research_packet_id: packet.id,
    draft_type: draftType,
    title: revisedCandidate.title,
    summary: revisedCandidate.summary,
    who_is_affected: revisedCandidate.who_is_affected,
    why_it_matters: revisedCandidate.why_it_matters,
    survival_actions: revisedCandidate.survival_actions,
    checklist_items: revisedCandidate.checklist_items,
    backup_options: revisedCandidate.backup_options,
    evidence_summary: revisedCandidate.evidence_summary,
    evidence_reference_ids: evidenceReferenceIds,
    ai_confidence: revisedCandidate.ai_confidence,
    status: "draft",
    reviewed_at: null,
    published_at: null,
  };

  const created = await createEditorialDraft(createPayload);
  if (!created) {
    throw new Error("Failed to persist calibrated editorial draft.");
  }

  // ── Step 15: Update with calibration metadata (additive JSONB fields) ────
  await updateEditorialDraft(created.id, {
    // Cast through unknown — the base UpdateDto may not yet know about these
    // Sprint 10.5 JSONB columns; the DB accepts them via the additive migration.
  } as Parameters<typeof updateEditorialDraft>[1]);

  // Directly update the calibration fields via raw query using the repository pattern
  // Note: We update these separately since the existing DTO types don't include Sprint 10.5 fields.
  // In a future schema freeze these would be included in the DTO.
  try {
    const { queryOne: rawQueryOne } = await import("@/server/polibrawl/db");
    await rawQueryOne(
      `update editorial_drafts
       set template_key = $2,
           generation_context = $3,
           critic_result = $4,
           quality_evaluation = $5
       where id = $1`,
      [
        created.id,
        templateKey,
        JSON.stringify(generationContext),
        JSON.stringify(criticResultForStorage),
        JSON.stringify(qualityEvaluation ?? null),
      ],
    );
  } catch {
    // Calibration metadata update failed — draft is still valid, just without metadata
    // This can happen if the migration has not been applied yet
    // Log the error but don't fail the generation
    console.warn(
      "[CalibratedGeneration] Could not update calibration metadata — migration may not be applied yet. Draft persisted without metadata.",
    );
  }

  // ── Step 16: Save ai_generated revision snapshot ──────────────────────────
  try {
    await createEditorialDraftRevision({
      editorial_draft_id: created.id,
      revision_type: "ai_generated",
      content_snapshot: buildRevisionContentSnapshot(revisedCandidate),
      actor_type: "ai",
      edit_distance_ratio: null, // no prior to compare
      fields_changed: [],
    });
  } catch {
    // Non-fatal — draft and calibration data are already saved
    console.warn(
      "[CalibratedGeneration] Could not save ai_generated revision snapshot — migration may not be applied yet.",
    );
  }

  return {
    draft: created,
    criticResult: finalCriticResult,
    templateKey,
    enrichedContextSummary: {
      platformName: context.platform.platformName,
      category: packet.category,
      evidenceStrength: context.evidence.evidenceStrength,
      totalEvidenceItems: context.evidence.totalEvidenceItems,
    },
  };
}
