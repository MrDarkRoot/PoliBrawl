import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { SourceDetailPanel } from "@/features/sources/components/source-detail-panel";
import {
  findLatestSnapshotForSource,
  listSnapshotsBySource,
} from "@/server/polibrawl/repositories/source-snapshot.repository";
import { findSourceRegistryById } from "@/server/polibrawl/repositories/source.repository";

export default async function SourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const source = await findSourceRegistryById(id).catch(() => null);

  if (!source) {
    notFound();
  }

  const [latestSnapshot, snapshots] = await Promise.all([
    findLatestSnapshotForSource(id).catch(() => null),
    listSnapshotsBySource(id).catch(() => []),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic B"
        title={source.title}
        description="Source detail for the PoliBrawl private source registry and capture history."
      />
      <SourceDetailPanel
        source={source}
        latestSnapshot={latestSnapshot}
        snapshots={snapshots}
      />
    </div>
  );
}
