import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth";
import { createEditorialTask } from "@/server/repositories/editorial-task-repository";
import {
  createDiscoveryRun,
  finalizeDiscoveryRun,
  insertSourceCandidates,
} from "@/server/repositories/discovery-repository";
import { getPlatformById } from "@/server/repositories/platform-repository";
import { runDiscovery } from "@/server/services/discovery/engine";

export async function POST(request: Request) {
  const auth = await requireAdminAccess();
  if (auth.kind === "missing-env") {
    return NextResponse.json({ error: "Supabase environment is not configured." }, { status: 500 });
  }

  const url = new URL(request.url);
  const platformId = url.searchParams.get("platformId");
  if (!platformId) {
    return NextResponse.json({ error: "platformId is required." }, { status: 400 });
  }

  const platform = await getPlatformById(platformId).catch(() => null);
  if (!platform) {
    return NextResponse.json({ error: "Platform not found." }, { status: 404 });
  }

  const run = await createDiscoveryRun({
    platformId,
    websiteUrl: platform.website_url,
  });

  try {
    const discovery = await runDiscovery({ websiteUrl: platform.website_url });
    await insertSourceCandidates(
      discovery.candidates.map((candidate) => ({
        discovery_run_id: run.id,
        platform_id: platformId,
        url: candidate.url,
        title: candidate.title,
        suggested_document_type: candidate.suggestedDocumentType,
        suggested_tier: candidate.suggestedTier,
        confidence: candidate.confidence,
        detection_reason: candidate.detectionReason,
      })),
    );

    await finalizeDiscoveryRun(run.id, {
      status: "completed",
      metadata: {
        origin: discovery.origin,
        robotsSitemaps: discovery.robotsSitemaps,
        candidateCount: discovery.candidates.length,
      },
    });

    await createEditorialTask({
      taskType: "source_candidate_review",
      platformId,
      relatedEntityType: "discovery_run",
      relatedEntityId: run.id,
      title: `Review discovered source candidates for ${platform.name}`,
      createdBy: auth.user.id,
      priority: "normal",
    });
  } catch (error) {
    await finalizeDiscoveryRun(run.id, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown discovery error",
    });
  }

  return NextResponse.redirect(new URL(`/admin/discovery/runs/${run.id}`, request.url));
}
