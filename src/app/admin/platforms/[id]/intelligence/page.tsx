import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { requireAdminAccess } from "@/lib/auth";
import { PlatformIntelligenceEditor } from "@/features/platform-intelligence/components/platform-intelligence-editor";
import { findPlatformById } from "@/server/polibrawl/repositories/platform.repository";
import { listDependencyScoresByPlatform } from "@/server/polibrawl/repositories/dependency-score.repository";
import { listEvidenceConfidenceByPlatform } from "@/server/polibrawl/repositories/evidence-confidence.repository";
import { listResolutionRoutesByPlatform } from "@/server/polibrawl/repositories/resolution-route.repository";
import { listRiskTimelinesByPlatform } from "@/server/polibrawl/repositories/risk-timeline.repository";

export default async function PlatformIntelligencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminAccess();

  const { id } = await params;
  const platform = await findPlatformById(id).catch(() => null);

  if (!platform) {
    notFound();
  }

  const [
    dependencyScores,
    evidenceConfidence,
    resolutionRoutes,
    riskTimelines,
  ] = await Promise.all([
    listDependencyScoresByPlatform(platform.id),
    listEvidenceConfidenceByPlatform(platform.id),
    listResolutionRoutesByPlatform(platform.id),
    listRiskTimelinesByPlatform(platform.id),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Platform Intelligence"
        title={`${platform.name} Intelligence Layer`}
        description="Add platform-level dependency estimates, escalation routes, risk timelines, and evidence confidence records for the public survival page."
      />

      <PlatformIntelligenceEditor
        dependencyScores={dependencyScores}
        evidenceConfidence={evidenceConfidence}
        platform={platform}
        resolutionRoutes={resolutionRoutes}
        riskTimelines={riskTimelines}
      />
    </div>
  );
}
