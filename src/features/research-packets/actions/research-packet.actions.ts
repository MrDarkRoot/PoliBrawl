"use server";

import {
  listResearchPacketsWithPlatform,
  findResearchPacketWithEvidence,
  updateResearchPacket,
} from "@/server/polibrawl/repositories/research-packet.repository";
import {
  buildResearchPacketForCandidate,
  exportPacketAsMarkdown,
  buildAiPromptTemplate,
} from "@/server/polibrawl/services/research-packet-builder.service";
import { findRedFlagCandidateById } from "@/server/polibrawl/repositories/red-flag-candidate.repository";
import type {
  ResearchPacketListFilters,
  ResearchPacketWithEvidence,
  Uuid,
} from "@/types/polibrawl";

export async function listResearchPacketsAction(
  filters: ResearchPacketListFilters = {},
) {
  return listResearchPacketsWithPlatform(filters, { limit: 100 });
}

export async function getResearchPacketDetailAction(
  packetId: Uuid,
): Promise<ResearchPacketWithEvidence | null> {
  return findResearchPacketWithEvidence(packetId);
}

export async function buildResearchPacketForCandidateAction(
  candidateId: Uuid,
): Promise<{ success: boolean; packetId?: Uuid; error?: string }> {
  const candidate = await findRedFlagCandidateById(candidateId);
  if (!candidate) {
    return { success: false, error: "Candidate not found" };
  }

  // Require a source snapshot to scan
  if (!candidate.source_snapshot_id) {
    return { success: false, error: "Candidate has no source snapshot — cannot build packet" };
  }

  // Fetch platform for display name
  const { findPlatformById } = await import("@/server/polibrawl/repositories/platform.repository");

  const platform = await findPlatformById(candidate.platform_id);
  const platformName = platform?.name ?? "Unknown Platform";

  const packet = await buildResearchPacketForCandidate({
    candidateId,
    platformId: candidate.platform_id,
    platformName,
    sourceSnapshotId: candidate.source_snapshot_id,
    sourceId: candidate.source_id,
    category: candidate.category,
  });

  if (!packet) {
    return { success: false, error: "No keyword matches found for this candidate" };
  }

  return { success: true, packetId: packet.id };
}

export async function markResearchPacketReadyAction(
  packetId: Uuid,
): Promise<{ success: boolean; error?: string }> {
  const updated = await updateResearchPacket(packetId, { status: "ready" });
  if (!updated) return { success: false, error: "Packet not found" };
  return { success: true };
}

export async function exportResearchPacketMarkdownAction(
  packetId: Uuid,
): Promise<{ success: boolean; markdown?: string; error?: string }> {
  const packet = await findResearchPacketWithEvidence(packetId);
  if (!packet) return { success: false, error: "Packet not found" };
  const markdown = exportPacketAsMarkdown(packet);
  return { success: true, markdown };
}

export async function getResearchPacketPromptAction(
  packetId: Uuid,
): Promise<{ success: boolean; prompt?: string; error?: string }> {
  const packet = await findResearchPacketWithEvidence(packetId);
  if (!packet) return { success: false, error: "Packet not found" };
  const prompt = buildAiPromptTemplate(packet);
  return { success: true, prompt };
}
