import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { SourceCaptureForm } from "@/features/sources/components/source-capture-form";
import { findSourceRegistryById } from "@/server/polibrawl/repositories/source.repository";

export default async function CaptureSourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const source = await findSourceRegistryById(id).catch(() => null);

  if (!source) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic B"
        title={`Capture ${source.title}`}
        description="Capture this source by safe public fetch or manual paste. Raw captures remain private and admin-only."
      />
      <SourceCaptureForm source={source} />
    </div>
  );
}
