import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { SourceSnapshotPanel } from "@/features/sources/components/source-snapshot-panel";
import { findSourceSnapshotDetailById } from "@/server/polibrawl/repositories/source-snapshot.repository";

export default async function SourceSnapshotDetailPage({
  params,
}: {
  params: Promise<{ id: string; snapshotId: string }>;
}) {
  const { id, snapshotId } = await params;
  const snapshot = await findSourceSnapshotDetailById(id, snapshotId).catch(
    () => null,
  );

  if (!snapshot) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic B"
        title={snapshot.title ?? snapshot.source_title}
        description="Admin-only source snapshot detail with private capture metadata and extracted text."
      />
      <SourceSnapshotPanel snapshot={snapshot} />
    </div>
  );
}
