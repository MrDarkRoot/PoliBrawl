import { PageHeader } from "@/components/shared/page-header";
import { SourceForm } from "@/features/sources/components/source-form";
import { listPlatforms } from "@/server/polibrawl/repositories/platform.repository";

export default async function NewSourcePage() {
  const platforms = await listPlatforms().catch(() => []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic B"
        title="Create Source"
        description="Register an important platform source before capturing fetch or paste text."
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
