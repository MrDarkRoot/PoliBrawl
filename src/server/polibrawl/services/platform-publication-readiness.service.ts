import "server-only";

import { queryMany, queryOne } from "@/server/polibrawl/db";
import { findPlatformById } from "@/server/polibrawl/repositories/platform.repository";
import { findPlatformSurvivalPageById, findPlatformSurvivalPageByPlatformId } from "@/server/polibrawl/repositories/platform-survival-page.repository";
import { listPageRedFlags } from "@/server/polibrawl/repositories/platform-survival-page-red-flag.repository";
import type {
  BackupOption,
  Checklist,
  ChecklistItem,
  DependencyScore,
  EvidenceConfidence,
  EvidenceItem,
  Platform,
  PlatformSurvivalPage,
  RedFlag,
  ResolutionRoute,
  RiskTimeline,
  SurvivalNote,
} from "@/types/polibrawl";
import {
  evaluatePlatformPublicationSnapshot,
  type PublicReadyRedFlag,
  type PlatformPublicationSnapshot,
} from "@/server/polibrawl/services/platform-publication-readiness.shared";

function groupByRedFlagId<T extends { red_flag_id?: string | null }>(rows: T[]) {
  const grouped = new Map<string, T[]>();

  rows.forEach((row) => {
    if (!row.red_flag_id) {
      return;
    }

    const existing = grouped.get(row.red_flag_id) ?? [];
    existing.push(row);
    grouped.set(row.red_flag_id, existing);
  });

  return grouped;
}

function groupByChecklistId(rows: ChecklistItem[]) {
  const grouped = new Map<string, ChecklistItem[]>();

  rows.forEach((row) => {
    const existing = grouped.get(row.checklist_id) ?? [];
    existing.push(row);
    grouped.set(row.checklist_id, existing);
  });

  return grouped;
}

async function getOfficialSourcesCount(platformId: string) {
  const result = await queryOne<{ count: string }>(
    `select count(*)::text as count
     from sources
     where platform_id = $1
       and status = 'active'
       and archived_at is null`,
    [platformId],
  );

  return Number(result?.count ?? 0);
}

async function getPageRedFlagSnapshot(pageId: string): Promise<PublicReadyRedFlag[]> {
  const pageRedFlags = await listPageRedFlags(pageId);

  if (pageRedFlags.length === 0) {
    return [];
  }

  const redFlagIds = pageRedFlags.map((item) => item.red_flag.id);
  const evidence = await queryMany<EvidenceItem>(
    `select *
     from evidence
     where red_flag_id = any($1)
       and status = 'approved'
       and archived_at is null`,
    [redFlagIds],
  );
  const notes = await queryMany<SurvivalNote>(
    `select *
     from survival_notes
     where red_flag_id = any($1)
       and status = 'published'
       and archived_at is null`,
    [redFlagIds],
  );
  const backupOptions = await queryMany<BackupOption>(
    `select *
     from backup_options
     where red_flag_id = any($1)
       and status = 'published'
       and archived_at is null`,
    [redFlagIds],
  );
  const checklists = await queryMany<Checklist>(
    `select *
     from checklists
     where red_flag_id = any($1)
       and status = 'published'
       and archived_at is null`,
    [redFlagIds],
  );
  const checklistItems = checklists.length
    ? await queryMany<ChecklistItem>(
        `select *
         from checklist_items
         where checklist_id = any($1)
           and status = 'published'
           and archived_at is null`,
        [checklists.map((checklist) => checklist.id)],
      )
    : [];

  const evidenceByRedFlag = groupByRedFlagId(evidence);
  const notesByRedFlag = groupByRedFlagId(notes);
  const backupByRedFlag = groupByRedFlagId(backupOptions);
  const checklistsByRedFlag = groupByRedFlagId(checklists);
  const checklistItemsByChecklist = groupByChecklistId(checklistItems);

  return pageRedFlags.map((pageRedFlag) => {
    const redFlagChecklists = checklistsByRedFlag.get(pageRedFlag.red_flag.id) ?? [];

    return {
      redFlag: pageRedFlag.red_flag,
      evidence: evidenceByRedFlag.get(pageRedFlag.red_flag.id) ?? [],
      survivalNotes: notesByRedFlag.get(pageRedFlag.red_flag.id) ?? [],
      backupOptions: backupByRedFlag.get(pageRedFlag.red_flag.id) ?? [],
      checklists: redFlagChecklists,
      checklistItems: redFlagChecklists.flatMap(
        (checklist) => checklistItemsByChecklist.get(checklist.id) ?? [],
      ),
    };
  });
}

export async function loadPlatformPublicationSnapshot(
  platformId: string,
  survivalPage: PlatformSurvivalPage | null,
): Promise<PlatformPublicationSnapshot> {
  const platform = await findPlatformById(platformId);
  const officialSourcesCount = await getOfficialSourcesCount(platformId);
  const pageRedFlags = survivalPage ? await getPageRedFlagSnapshot(survivalPage.id) : [];
  const [publishedDependencyScores, publishedEvidenceConfidence, publishedRiskTimelines, publishedResolutionRoutes] =
    await Promise.all([
      queryMany<DependencyScore>(
        `select *
         from dependency_scores
         where platform_id = $1
           and status = 'published'
           and archived_at is null
         order by generated_at desc, updated_at desc`,
        [platformId],
      ),
      queryMany<EvidenceConfidence>(
        `select *
         from evidence_confidence
         where platform_id = $1
           and status = 'published'
           and archived_at is null
         order by last_verified_at desc nulls last, updated_at desc`,
        [platformId],
      ),
      queryMany<RiskTimeline>(
        `select *
         from risk_timelines
         where platform_id = $1
           and status = 'published'
           and archived_at is null
         order by display_order asc, updated_at desc`,
        [platformId],
      ),
      queryMany<ResolutionRoute>(
        `select *
         from resolution_routes
         where platform_id = $1
           and status = 'published'
           and archived_at is null
         order by display_order asc, updated_at desc`,
        [platformId],
      ),
    ]);

  return {
    platform,
    survivalPage,
    officialSourcesCount,
    pageRedFlags,
    publishedDependencyScores,
    publishedEvidenceConfidence,
    publishedRiskTimelines,
    publishedResolutionRoutes,
  };
}

export { evaluatePlatformPublicationSnapshot };

export async function evaluatePlatformPublicationReadiness(platformId: string) {
  const survivalPage = await findPlatformSurvivalPageByPlatformId(platformId);
  const snapshot = await loadPlatformPublicationSnapshot(platformId, survivalPage);
  return evaluatePlatformPublicationSnapshot(snapshot);
}

export async function evaluatePlatformPublicationReadinessForPage(pageId: string) {
  const survivalPage = await findPlatformSurvivalPageById(pageId);
  if (!survivalPage) {
    throw new Error("Page not found");
  }

  const snapshot = await loadPlatformPublicationSnapshot(survivalPage.platform_id, survivalPage);
  return evaluatePlatformPublicationSnapshot(snapshot);
}

export async function isPlatformPubliclyReady(platformId: string) {
  const evaluation = await evaluatePlatformPublicationReadiness(platformId);
  return evaluation.ready;
}
