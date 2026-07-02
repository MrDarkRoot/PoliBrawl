import { requireAdminAccess } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { SurvivalPageForm } from "@/features/survival-pages/components/survival-page-form";
import { listPlatforms } from "@/server/polibrawl/repositories/platform.repository";

export default async function NewSurvivalPage() {
  await requireAdminAccess();
  
  const platforms = await listPlatforms();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Survival Pages" title="Create New Draft" />
      <div className="bg-white p-6 border rounded-lg shadow-sm">
        <SurvivalPageForm platforms={platforms.filter(p => p.status !== 'archived')} />
      </div>
    </div>
  );
}
