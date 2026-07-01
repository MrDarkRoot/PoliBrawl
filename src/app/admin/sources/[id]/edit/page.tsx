import { notFound } from "next/navigation";

import { SourceForm } from "@/components/forms/source-form";
import { PageHeader } from "@/components/shared/page-header";
import { listPlatforms } from "@/server/repositories/platform-repository";
import { getPolicySourceById } from "@/server/repositories/source-repository";

export default async function EditSourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [source, platforms] = await Promise.all([
    getPolicySourceById(id).catch(() => null),
    listPlatforms().catch(() => []),
  ]);

  if (!source) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic 3"
        title="Edit source"
        description="Maintain source metadata, tiering, and monitoring state."
      />
      <SourceForm
        mode="edit"
        initialValues={{ ...source, id: source.id }}
        platformOptions={platforms.map((platform) => ({
          id: platform.id,
          name: platform.name,
        }))}
      />
    </div>
  );
}
