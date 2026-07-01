import { PageHeader } from "@/components/shared/page-header";
import { PlatformForm } from "@/components/forms/platform-form";

export default function NewPlatformPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic 1"
        title="Create platform"
        description="Add the minimum viable platform metadata needed to start discovery and editorial processing."
      />
      <PlatformForm mode="create" />
    </div>
  );
}
