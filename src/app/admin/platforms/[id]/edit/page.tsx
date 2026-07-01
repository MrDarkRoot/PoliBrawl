import { notFound } from "next/navigation";

import { PlatformForm } from "@/components/forms/platform-form";
import { PageHeader } from "@/components/shared/page-header";
import { getPlatformById } from "@/server/repositories/platform-repository";

export default async function EditPlatformPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const platform = await getPlatformById(id).catch(() => null);

  if (!platform) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic 1"
        title={`Edit ${platform.name}`}
        description="Update the platform metadata used by discovery, source registry, and review workflows."
      />
      <PlatformForm mode="edit" initialValues={platform} />
    </div>
  );
}
