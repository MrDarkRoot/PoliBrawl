"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/auth";
import { findPlatformById } from "@/server/polibrawl/repositories/platform.repository";
import {
  archiveDependencyScore,
  createDependencyScore,
  findDependencyScoreById,
  listDependencyScoresByPlatform,
  updateDependencyScore,
} from "@/server/polibrawl/repositories/dependency-score.repository";
import {
  archiveEvidenceConfidence,
  createEvidenceConfidence,
  findEvidenceConfidenceById,
  listEvidenceConfidenceByPlatform,
  updateEvidenceConfidence,
} from "@/server/polibrawl/repositories/evidence-confidence.repository";
import {
  getMaxResolutionRouteDisplayOrder,
  archiveResolutionRoute,
  createResolutionRoute,
  findResolutionRouteById,
  updateResolutionRoute,
} from "@/server/polibrawl/repositories/resolution-route.repository";
import {
  getMaxRiskTimelineDisplayOrder,
  archiveRiskTimeline,
  createRiskTimeline,
  findRiskTimelineById,
  updateRiskTimeline,
} from "@/server/polibrawl/repositories/risk-timeline.repository";
import { normalizeOptionalDatetime } from "@/features/platform-intelligence/intelligence-formats";
import {
  dependencyScoreFormSchema,
  evidenceConfidenceFormSchema,
  resolutionRouteFormSchema,
  riskTimelineFormSchema,
} from "@/features/platform-intelligence/schemas/intelligence.schema";

async function revalidatePlatformIntelligence(platformId: string) {
  const platform = await findPlatformById(platformId);

  revalidatePath(`/admin/platforms/${platformId}`);
  revalidatePath(`/admin/platforms/${platformId}/intelligence`);

  if (platform?.slug) {
    revalidatePath(`/platforms/${platform.slug}`);
  }
}

function getPublishedAt(status: "draft" | "published", existingValue: string | null | undefined) {
  if (status !== "published") {
    return null;
  }

  return existingValue ?? new Date().toISOString();
}

export async function upsertResolutionRouteAction(
  platformId: string,
  routeId: string | null,
  formData: FormData,
) {
  await requireAdminAccess();

  const parsed = resolutionRouteFormSchema.safeParse({
    organization_name: formData.get("organization_name"),
    organization_type: formData.get("organization_type"),
    country: formData.get("country"),
    jurisdiction: formData.get("jurisdiction"),
    official_url: formData.get("official_url"),
    eligible_users: formData.get("eligible_users"),
    eligible_disputes: formData.get("eligible_disputes"),
    requirements: formData.get("requirements"),
    steps: formData.get("steps"),
    fees: formData.get("fees"),
    limits: formData.get("limits"),
    deadline: formData.get("deadline"),
    verification_source: formData.get("verification_source"),
    last_verified_at: formData.get("last_verified_at"),
    status: formData.get("status"),
    display_order: formData.get("display_order"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid resolution route input.");
  }

  const existing = routeId ? await findResolutionRouteById(routeId) : null;
  if (routeId && (!existing || existing.platform_id !== platformId)) {
    throw new Error("Resolution route not found for this platform.");
  }

  const displayOrder =
    existing?.display_order ?? ((await getMaxResolutionRouteDisplayOrder(platformId)) + 1);

  const payload = {
    platform_id: platformId,
    organization_name: parsed.data.organization_name,
    organization_type: parsed.data.organization_type,
    country: parsed.data.country,
    jurisdiction: parsed.data.jurisdiction,
    official_url: parsed.data.official_url,
    eligible_users: parsed.data.eligible_users,
    eligible_disputes: parsed.data.eligible_disputes,
    requirements: parsed.data.requirements,
    steps: parsed.data.steps,
    fees: parsed.data.fees,
    limits: parsed.data.limits,
    deadline: parsed.data.deadline,
    verification_source: parsed.data.verification_source,
    last_verified_at: normalizeOptionalDatetime(formData.get("last_verified_at")),
    status: parsed.data.status,
    published_at: getPublishedAt(parsed.data.status, existing?.published_at),
    display_order: displayOrder,
  };

  if (existing) {
    await updateResolutionRoute(existing.id, payload);
  } else {
    await createResolutionRoute(payload);
  }

  await revalidatePlatformIntelligence(platformId);
}

export async function archiveResolutionRouteAction(platformId: string, routeId: string) {
  await requireAdminAccess();

  const existing = await findResolutionRouteById(routeId);
  if (!existing || existing.platform_id !== platformId) {
    throw new Error("Resolution route not found for this platform.");
  }

  await archiveResolutionRoute(routeId);
  await revalidatePlatformIntelligence(platformId);
}

export async function upsertDependencyScoreAction(
  platformId: string,
  scoreId: string | null,
  formData: FormData,
) {
  await requireAdminAccess();

  const parsed = dependencyScoreFormSchema.safeParse({
    score: formData.get("score"),
    risk_level: formData.get("risk_level"),
    factors: formData.get("factors"),
    explanation: formData.get("explanation"),
    generated_at: formData.get("generated_at"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid dependency score input.");
  }

  const existing = scoreId ? await findDependencyScoreById(scoreId) : null;
  if (scoreId && (!existing || existing.platform_id !== platformId)) {
    throw new Error("Dependency score not found for this platform.");
  }

  if (parsed.data.status === "published") {
    const publishedSibling = (await listDependencyScoresByPlatform(platformId)).find(
      (item) => item.status === "published" && item.archived_at === null && item.id !== existing?.id,
    );

    if (publishedSibling) {
      throw new Error(
        "Archive the existing published dependency score before publishing another one.",
      );
    }
  }

  const generatedAt =
    normalizeOptionalDatetime(formData.get("generated_at")) ??
    existing?.generated_at ??
    new Date().toISOString();

  const payload = {
    platform_id: platformId,
    score: parsed.data.score,
    risk_level: parsed.data.risk_level,
    factors: parsed.data.factors,
    explanation: parsed.data.explanation,
    generated_at: generatedAt,
    status: parsed.data.status,
    published_at: getPublishedAt(parsed.data.status, existing?.published_at),
  };

  if (existing) {
    await updateDependencyScore(existing.id, payload);
  } else {
    await createDependencyScore(payload);
  }

  await revalidatePlatformIntelligence(platformId);
}

export async function archiveDependencyScoreAction(platformId: string, scoreId: string) {
  await requireAdminAccess();

  const existing = await findDependencyScoreById(scoreId);
  if (!existing || existing.platform_id !== platformId) {
    throw new Error("Dependency score not found for this platform.");
  }

  await archiveDependencyScore(scoreId);
  await revalidatePlatformIntelligence(platformId);
}

export async function upsertRiskTimelineAction(
  platformId: string,
  timelineId: string | null,
  formData: FormData,
) {
  await requireAdminAccess();

  const parsed = riskTimelineFormSchema.safeParse({
    title: formData.get("title"),
    events: formData.get("events"),
    source: formData.get("source"),
    status: formData.get("status"),
    display_order: formData.get("display_order"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid risk timeline input.");
  }

  const existing = timelineId ? await findRiskTimelineById(timelineId) : null;
  if (timelineId && (!existing || existing.platform_id !== platformId)) {
    throw new Error("Risk timeline not found for this platform.");
  }

  const displayOrder =
    existing?.display_order ?? ((await getMaxRiskTimelineDisplayOrder(platformId)) + 1);

  const payload = {
    platform_id: platformId,
    title: parsed.data.title,
    events: parsed.data.events,
    source: parsed.data.source,
    status: parsed.data.status,
    published_at: getPublishedAt(parsed.data.status, existing?.published_at),
    display_order: existing?.display_order ?? displayOrder,
  };

  if (existing) {
    await updateRiskTimeline(existing.id, payload);
  } else {
    await createRiskTimeline(payload);
  }

  await revalidatePlatformIntelligence(platformId);
}

export async function archiveRiskTimelineAction(platformId: string, timelineId: string) {
  await requireAdminAccess();

  const existing = await findRiskTimelineById(timelineId);
  if (!existing || existing.platform_id !== platformId) {
    throw new Error("Risk timeline not found for this platform.");
  }

  await archiveRiskTimeline(timelineId);
  await revalidatePlatformIntelligence(platformId);
}

export async function upsertEvidenceConfidenceAction(
  platformId: string,
  confidenceId: string | null,
  formData: FormData,
) {
  await requireAdminAccess();

  const parsed = evidenceConfidenceFormSchema.safeParse({
    score: formData.get("score"),
    factors: formData.get("factors"),
    last_verified_at: formData.get("last_verified_at"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid evidence confidence input.");
  }

  const existing = confidenceId ? await findEvidenceConfidenceById(confidenceId) : null;
  if (confidenceId && (!existing || existing.platform_id !== platformId)) {
    throw new Error("Evidence confidence record not found for this platform.");
  }

  if (parsed.data.status === "published") {
    const publishedSibling = (await listEvidenceConfidenceByPlatform(platformId)).find(
      (item) => item.status === "published" && item.archived_at === null && item.id !== existing?.id,
    );

    if (publishedSibling) {
      throw new Error(
        "Archive the existing published evidence confidence record before publishing another one.",
      );
    }
  }

  const payload = {
    platform_id: platformId,
    score: parsed.data.score,
    factors: parsed.data.factors,
    last_verified_at: normalizeOptionalDatetime(formData.get("last_verified_at")),
    status: parsed.data.status,
    published_at: getPublishedAt(parsed.data.status, existing?.published_at),
  };

  if (existing) {
    await updateEvidenceConfidence(existing.id, payload);
  } else {
    await createEvidenceConfidence(payload);
  }

  await revalidatePlatformIntelligence(platformId);
}

export async function archiveEvidenceConfidenceAction(platformId: string, confidenceId: string) {
  await requireAdminAccess();

  const existing = await findEvidenceConfidenceById(confidenceId);
  if (!existing || existing.platform_id !== platformId) {
    throw new Error("Evidence confidence record not found for this platform.");
  }

  await archiveEvidenceConfidence(confidenceId);
  await revalidatePlatformIntelligence(platformId);
}
