import { requireAdminAccess } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { findPlatformSurvivalPageById } from "@/server/polibrawl/repositories/platform-survival-page.repository";
import { listPageRedFlags } from "@/server/polibrawl/repositories/platform-survival-page-red-flag.repository";
import { evaluatePlatformSurvivalPage } from "@/server/polibrawl/services/survival-page-composer.service";
import { SurvivalPageComposer } from "@/features/survival-pages/components/survival-page-composer";
import { queryMany } from "@/server/polibrawl/db";
import type { RedFlag } from "@/types/polibrawl";

export default async function SurvivalPageComposerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminAccess();
  const { id } = await params;

  const page = await findPlatformSurvivalPageById(id);
  if (!page) notFound();

  const attachedRedFlags = await listPageRedFlags(id);
  const quality = await evaluatePlatformSurvivalPage(id);

  const attachedIds = attachedRedFlags.map(r => r.red_flag_id);
  const allDraftFlags = await queryMany<RedFlag>(
    `SELECT * FROM red_flags WHERE platform_id = $1 AND status != 'archived'`,
    [page.platform_id]
  );
  
  const availableRedFlags = allDraftFlags.filter(rf => !attachedIds.includes(rf.id));

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Platform Survival Page" title={page.title} />
      <SurvivalPageComposer 
        page={page} 
        attachedRedFlags={attachedRedFlags} 
        quality={quality}
        availableRedFlags={availableRedFlags}
      />
    </div>
  );
}
