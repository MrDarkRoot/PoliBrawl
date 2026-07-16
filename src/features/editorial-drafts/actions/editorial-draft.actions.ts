"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminAccess } from "@/lib/auth";
import { editorialDraftFormSchema } from "@/features/editorial-drafts/schemas/editorial-draft.schema";
import {
  findEditorialDraftById,
  updateEditorialDraft,
} from "@/server/polibrawl/repositories/editorial-draft.repository";
import { findPlatformBySlug } from "@/server/polibrawl/repositories/platform.repository";
import {
  findResearchPacketWithEvidence,
  listResearchPacketsWithPlatform,
} from "@/server/polibrawl/repositories/research-packet.repository";
import { aiEditorialWorkerService } from "@/server/polibrawl/services/editorial/ai-editorial-worker.service";
import {
  getDraftStatusForIntent,
  validateEditorialAiDraftCandidate,
} from "@/server/polibrawl/services/editorial/editorial-ai-validator.service";
import { assertEditorialDraftStatusTransition } from "@/server/polibrawl/services/editorial/editorial-draft-workflow.shared";
import type { EditorialDraftStatus, Uuid } from "@/types/polibrawl";

async function revalidateEditorialDraftPaths(platformSlug: string | null | undefined, packetId?: string) {
  revalidatePath("/admin/editorial-drafts");

  if (packetId) {
    revalidatePath(`/admin/research-packets/${packetId}`);
  }

  if (platformSlug) {
    revalidatePath(`/platforms/${platformSlug}`);
  }
}

function getStatusTimestamps(
  currentStatus: EditorialDraftStatus,
  nextStatus: EditorialDraftStatus,
  existingReviewedAt: string | null,
  existingPublishedAt: string | null,
) {
  const now = new Date().toISOString();

  if (nextStatus === "approved" || nextStatus === "rejected") {
    return {
      reviewed_at: existingReviewedAt ?? now,
      published_at: null,
    };
  }

  if (nextStatus === "published") {
    return {
      reviewed_at: existingReviewedAt ?? now,
      published_at: existingPublishedAt ?? now,
    };
  }

  if (nextStatus === currentStatus) {
    return {
      reviewed_at: existingReviewedAt,
      published_at: existingPublishedAt,
    };
  }

  return {
    reviewed_at: existingReviewedAt,
    published_at: null,
  };
}

export async function updateEditorialDraftAction(draftId: Uuid, formData: FormData) {
  await requireAdminAccess();

  const existing = await findEditorialDraftById(draftId);
  if (!existing || existing.archived_at) {
    throw new Error("Editorial draft not found.");
  }

  const intent = String(formData.get("intent") ?? "save");
  const nextStatus = getDraftStatusForIntent(existing.status, intent);

  assertEditorialDraftStatusTransition(existing.status, nextStatus);

  const parsed = editorialDraftFormSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary"),
    who_is_affected: formData.get("who_is_affected"),
    why_it_matters: formData.get("why_it_matters"),
    survival_actions: formData.get("survival_actions"),
    checklist_items: formData.get("checklist_items"),
    backup_options: formData.get("backup_options"),
    evidence_summary: formData.get("evidence_summary"),
    ai_confidence: formData.get("ai_confidence"),
    status: nextStatus,
    reviewed_at: formData.get("reviewed_at"),
    published_at: formData.get("published_at"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid editorial draft input.");
  }

  const packet = await findResearchPacketWithEvidence(existing.research_packet_id);
  if (!packet) {
    throw new Error("Linked research packet was not found.");
  }

  const validation = validateEditorialAiDraftCandidate(
    {
      title: parsed.data.title,
      summary: parsed.data.summary,
      who_is_affected: parsed.data.who_is_affected,
      why_it_matters: parsed.data.why_it_matters,
      survival_actions: parsed.data.survival_actions,
      checklist_items: parsed.data.checklist_items,
      backup_options: parsed.data.backup_options,
      evidence_summary: parsed.data.evidence_summary,
      ai_confidence: parsed.data.ai_confidence,
      evidence_reference_ids: existing.evidence_reference_ids,
    },
    packet.evidence.map((item) => item.id),
  );

  if (!validation.ok) {
    throw new Error(validation.errors.join(" "));
  }

  const timestamps = getStatusTimestamps(
    existing.status,
    nextStatus,
    existing.reviewed_at,
    existing.published_at,
  );

  await updateEditorialDraft(existing.id, {
    title: parsed.data.title,
    summary: parsed.data.summary,
    who_is_affected: parsed.data.who_is_affected,
    why_it_matters: parsed.data.why_it_matters,
    survival_actions: parsed.data.survival_actions,
    checklist_items: parsed.data.checklist_items,
    backup_options: parsed.data.backup_options,
    evidence_summary: parsed.data.evidence_summary,
    ai_confidence: parsed.data.ai_confidence,
    status: nextStatus,
    reviewed_at: timestamps.reviewed_at,
    published_at: timestamps.published_at,
  });

  await revalidateEditorialDraftPaths(undefined, existing.research_packet_id);
  redirect(`/admin/editorial-drafts/${draftId}`);
}

export async function generateEditorialDraftFromResearchPacketAction(
  researchPacketId: Uuid,
) {
  await requireAdminAccess();

  const created = await aiEditorialWorkerService.generateDraft({
    researchPacketId,
    draftType: "platform_survival_guide",
  });

  await revalidateEditorialDraftPaths(undefined, researchPacketId);
  redirect(`/admin/editorial-drafts/${created.id}`);
}

export async function generatePaypalDemoEditorialDraftAction() {
  await requireAdminAccess();

  const platform = await findPlatformBySlug("paypal");
  if (!platform) {
    throw new Error("PayPal platform record not found.");
  }

  const packets = await listResearchPacketsWithPlatform(
    { platform_id: platform.id },
    { limit: 20 },
  );

  const preferredPacket =
    packets.find((packet) => packet.category === "account") ??
    packets.find((packet) => packet.category === "money") ??
    packets[0];

  if (!preferredPacket) {
    throw new Error("No PayPal research packet is available for the demo draft.");
  }

  const created = await aiEditorialWorkerService.generateDraft({
    researchPacketId: preferredPacket.id,
    draftType: "platform_survival_guide",
  });

  await revalidateEditorialDraftPaths(platform.slug, preferredPacket.id);
  redirect(`/admin/editorial-drafts/${created.id}`);
}
