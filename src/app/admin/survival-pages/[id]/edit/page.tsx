import { requireAdminAccess } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { findPlatformSurvivalPageById } from "@/server/polibrawl/repositories/platform-survival-page.repository";
import { SurvivalPageForm } from "@/features/survival-pages/components/survival-page-form";
import { findPlatformById } from "@/server/polibrawl/repositories/platform.repository";
import { notFound } from "next/navigation";

export default async function EditSurvivalPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminAccess();
  const { id } = await params;
  
  const page = await findPlatformSurvivalPageById(id);
  if (!page) notFound();

  const platform = await findPlatformById(page.platform_id);
  if (!platform) notFound();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Survival Pages" title={`Edit: ${page.title}`} />
      <div className="bg-white p-6 border rounded-lg shadow-sm">
        <SurvivalPageForm page={page} platforms={[platform]} />
      </div>
    </div>
  );
}
