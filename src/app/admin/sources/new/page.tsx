import { SourceForm } from "@/components/forms/source-form";
import { PageHeader } from "@/components/shared/page-header";
import { listPlatforms } from "@/server/repositories/platform-repository";

export default async function NewSourcePage() {
  const platforms = await listPlatforms().catch(() => []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic 3"
        title="Create manual source"
        description="Register a policy source directly when discovery misses it or when you already know the canonical URL."
      />
      <SourceForm
        mode="create"
        platformOptions={platforms.map((platform) => ({
          id: platform.id,
          name: platform.name,
        }))}
      />
    </div>
  );
}
