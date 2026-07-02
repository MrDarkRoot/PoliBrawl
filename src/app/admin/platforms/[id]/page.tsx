import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { PlatformDetailPanel } from "@/features/platforms/components/platform-detail-panel";
import { findPlatformById } from "@/server/polibrawl/repositories/platform.repository";

export default async function PlatformDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const platform = await findPlatformById(id).catch(() => null);

  if (!platform) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic B"
        title={platform.name}
        description="Platform detail for the PoliBrawl Platform Registry. Related modules are placeholders until later sprints."
      />
      <PlatformDetailPanel platform={platform} />
    </div>
  );
}
