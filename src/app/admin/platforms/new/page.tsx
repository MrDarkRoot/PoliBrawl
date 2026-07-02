import { PageHeader } from "@/components/shared/page-header";
import { PlatformForm } from "@/features/platforms/components/platform-form";

export default function NewPlatformPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic B"
        title="Create Platform"
        description="Add the minimum platform metadata needed to start the PoliBrawl internal CMS path."
      />
      <PlatformForm mode="create" />
    </div>
  );
}
