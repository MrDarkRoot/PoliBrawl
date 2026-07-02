import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { SourceForm } from "@/features/sources/components/source-form";
import { listPlatforms } from "@/server/polibrawl/repositories/platform.repository";
import { findSourceById } from "@/server/polibrawl/repositories/source.repository";

export default async function EditSourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [source, platforms] = await Promise.all([
    findSourceById(id).catch(() => null),
    listPlatforms().catch(() => []),
  ]);

  if (!source) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic B"
        title={`Edit ${source.title}`}
        description="Update source registry metadata for this PoliBrawl source."
      />
      <SourceForm
        mode="edit"
        initialValues={source}
        platformOptions={platforms.map((platform) => ({
          id: platform.id,
          name: platform.name,
        }))}
      />
    </div>
  );
}
