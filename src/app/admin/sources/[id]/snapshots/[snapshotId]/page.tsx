import Link from "next/link";
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          eyebrow="Epic B"
          title={snapshot.title ?? snapshot.source_title}
          description="Admin-only source snapshot detail with private capture metadata and extracted text."
        />
        <Link
          href={`/admin/sources/${id}/snapshots/${snapshotId}/scan`}
          className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          Run Keyword Scanner
        </Link>
      </div>
      <SourceSnapshotPanel snapshot={snapshot} />
    </div>
  );
}
