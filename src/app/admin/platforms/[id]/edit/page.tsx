import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { PlatformForm } from "@/features/platforms/components/platform-form";
import { findPlatformById } from "@/server/polibrawl/repositories/platform.repository";

export default async function EditPlatformPage({
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
        title={`Edit ${platform.name}`}
        description="Update the platform metadata used by the new PoliBrawl Platform Registry."
      />
      <PlatformForm mode="edit" initialValues={platform} />
    </div>
  );
}
