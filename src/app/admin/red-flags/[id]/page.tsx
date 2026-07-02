import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { queryOne, queryMany } from "@/server/polibrawl/db";
import { evaluateDraftRedFlag } from "@/server/polibrawl/services/red-flag-quality.service";
import type { RedFlag, EvidenceItem, SurvivalNote, BackupOption, Checklist, ChecklistItem } from "@/types/polibrawl";
import { WorkspaceTabs } from "@/features/red-flags/components/workspace-tabs";

export const metadata = { title: "Red Flag Workspace — PoliBrawl Admin" };

export default async function RedFlagWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const redFlag = await queryOne<RedFlag & { platform_name: string }>(
    `SELECT r.*, p.name as platform_name
     FROM red_flags r
     JOIN platforms p ON r.platform_id = p.id
     WHERE r.id = $1`,
    [id]
  );

  if (!redFlag) notFound();

  const evidence = await queryMany<EvidenceItem>(
    `SELECT * FROM evidence WHERE red_flag_id = $1 ORDER BY display_order ASC, sort_order ASC`,
    [id]
  );

  const notes = await queryMany<SurvivalNote>(
    `SELECT * FROM survival_notes WHERE red_flag_id = $1 ORDER BY display_order ASC`,
    [id]
  );

  const backups = await queryMany<BackupOption>(
    `SELECT * FROM backup_options WHERE red_flag_id = $1 ORDER BY created_at ASC`,
    [id]
  );

  const checklists = await queryMany<Checklist>(
    `SELECT * FROM checklists WHERE red_flag_id = $1`,
    [id]
  );

  const checklistItems = checklists.length > 0 
    ? await queryMany<ChecklistItem>(
        `SELECT * FROM checklist_items WHERE checklist_id = ANY($1) ORDER BY display_order ASC, sort_order ASC`,
        [checklists.map(c => c.id)]
      )
    : [];

  const quality = await evaluateDraftRedFlag(id);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader 
          eyebrow="Editorial Workspace" 
          title={redFlag.title} 
          description={`${redFlag.platform_name} | ${redFlag.category} | ${redFlag.level}`} 
        />
        <div className="flex items-center gap-3">
          {quality.ready_for_publish ? (
            <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">Ready for Publish</span>
          ) : (
            <span className="text-sm font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">Needs Work</span>
          )}
          <StatusBadge value={redFlag.status} />
        </div>
      </div>

      <WorkspaceTabs 
        redFlag={redFlag} 
        evidence={evidence} 
        notes={notes} 
        backups={backups}
        checklists={checklists}
        checklistItems={checklistItems}
        quality={quality}
      />
    </div>
  );
}
