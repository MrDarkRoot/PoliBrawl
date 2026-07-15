import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth";
import { logDecision } from "@/server/repositories/decision-log-repository";
import { createEditorialTask } from "@/server/repositories/editorial-task-repository";
import {
  getSourceCandidateById,
  updateSourceCandidate,
} from "@/server/repositories/discovery-repository";
import {
  createPolicySourceFromCandidate,
  findPolicySourceByPlatformUrl,
} from "@/server/repositories/source-repository";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminAccess();

  const { id } = await params;
  const candidate = await getSourceCandidateById(id).catch(() => null);
  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
  }

  const existing = await findPolicySourceByPlatformUrl(candidate.platform_id, candidate.url);
  if (existing) {
    return NextResponse.redirect(new URL(`/admin/sources/${existing.id}`, request.url));
  }

  const source = await createPolicySourceFromCandidate({
    platform_id: candidate.platform_id,
    title: candidate.title,
    url: candidate.url,
    final_url: null,
    document_type: candidate.suggested_document_type ?? "other",
    source_tier: candidate.suggested_tier ?? "tier_3_context",
    use_for_scoring: false,
    monitor_enabled: false,
    status: "active",
    last_reviewed_at: null,
    created_by: auth.user.id,
    content_document_type: candidate.content_document_type,
    content_source_tier: candidate.content_source_tier,
    content_use_for_scoring: candidate.content_use_for_scoring,
    content_monitor_enabled: candidate.content_monitor_enabled,
    content_confidence: candidate.content_confidence,
    content_classification_reasons: Array.isArray(candidate.content_classification_reasons)
      ? candidate.content_classification_reasons
      : [],
    content_classified_at: candidate.content_preview_fetched_at,
  });

  await updateSourceCandidate(id, {
    status: "approved",
    reviewed_at: new Date().toISOString(),
    reviewed_by: auth.user.id,
  });

  await createEditorialTask({
    taskType: "document_review",
    platformId: candidate.platform_id,
    relatedEntityType: "policy_source",
    relatedEntityId: source.id,
    title: `Fetch and process ${source.title ?? source.url}`,
    createdBy: auth.user.id,
  });

  await logDecision({
    platformId: candidate.platform_id,
    entityType: "source_candidate",
    entityId: candidate.id,
    action: "source_candidate.approved",
    newValue: source,
    decidedBy: auth.user.id,
  });

  return NextResponse.redirect(new URL(`/admin/sources/${source.id}`, request.url));
}
