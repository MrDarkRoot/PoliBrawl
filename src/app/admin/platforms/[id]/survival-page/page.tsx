import { requireAdminAccess } from "@/lib/auth";
import { findPlatformById } from "@/server/polibrawl/repositories/platform.repository";
import { findPlatformSurvivalPageByPlatformId } from "@/server/polibrawl/repositories/platform-survival-page.repository";
import { createDefaultSurvivalPageForPlatformAction } from "@/features/survival-pages/actions/survival-page.actions";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";

export default async function PlatformSurvivalPageRedirect({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminAccess();
  const { id } = await params;

  const platform = await findPlatformById(id);
  if (!platform) notFound();

  const page = await findPlatformSurvivalPageByPlatformId(id);
  
  if (page) {
    redirect(`/admin/survival-pages/${page.id}`);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader eyebrow="Platform Context" title={`${platform.name} Survival Page`} />
      
      <div className="bg-white p-6 border rounded-lg shadow-sm">
        <h3 className="text-lg font-medium mb-2">No survival page exists yet</h3>
        <p className="text-gray-600 mb-6">
          A survival page composes multiple red flags together for a platform.
        </p>
        
        <form action={async () => {
          "use server";
          await createDefaultSurvivalPageForPlatformAction(id);
        }}>
          <button type="submit" disabled={false} className="px-4 py-2 bg-blue-600 text-white rounded">Create Default Survival Page</button>
        </form>
      </div>
    </div>
  );
}
