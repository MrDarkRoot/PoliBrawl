import "server-only";

import { queryMany, queryOne } from "@/server/polibrawl/db";
import { isPlatformPubliclyReady } from "@/server/polibrawl/services/platform-publication-readiness.service";
import {
  toPublicPageRedFlag,
  toPublicRedFlagDetail,
  type PublicPageRedFlag,
  type PublicRedFlagDetail,
} from "@/server/polibrawl/services/public-view-models.shared";
import type {
  BackupOption,
  Checklist,
  ChecklistItem,
  DependencyScore,
  EvidenceConfidence,
  EvidenceItem as Evidence,
  Platform,
  PlatformSurvivalPage,
  RedFlag,
  ResolutionRoute,
  RiskTimeline,
  SurvivalNote,
} from "@/types/polibrawl";

export async function getPublicPlatforms(): Promise<Platform[]> {
  const platforms = await queryMany<Platform>(
    `SELECT * FROM platforms WHERE status = 'published' ORDER BY name ASC`,
  );

  const readiness = await Promise.all(
    platforms.map(async (platform) => ({
      platform,
      ready: await isPlatformPubliclyReady(platform.id),
    })),
  );

  return readiness.filter((item) => item.ready).map((item) => item.platform);
}

export async function getPublicPlatformById(id: string): Promise<Platform | null> {
  const platform = await queryOne<Platform>(
    `SELECT * FROM platforms WHERE id = $1 AND status = 'published'`,
    [id],
  );

  if (!platform) {
    return null;
  }

  return (await isPlatformPubliclyReady(platform.id)) ? platform : null;
}

export async function getPublicPlatformBySlug(slug: string): Promise<Platform | null> {
  const platform = await queryOne<Platform>(
    `SELECT * FROM platforms WHERE slug = $1 AND status = 'published'`,
    [slug]
  );

  if (!platform) {
    return null;
  }

  return (await isPlatformPubliclyReady(platform.id)) ? platform : null;
}

export async function getPublicSurvivalPage(platformId: string): Promise<PlatformSurvivalPage | null> {
  return queryOne<PlatformSurvivalPage>(
    `SELECT * FROM platform_survival_pages WHERE platform_id = $1 AND (status = 'ready_for_publish' OR ready_for_publish = true) AND archived_at IS NULL`,
    [platformId]
  );
}

export async function getPublicRedFlags(pageId: string): Promise<PublicPageRedFlag[]> {
  const redFlags = await queryMany<PublicPageRedFlag>(
    `SELECT
       rf.id,
       rf.platform_id,
       rf.slug,
       rf.title,
       rf.category,
       rf.level,
       rf.summary,
       rf.why_it_matters,
       prf.section_label
     FROM red_flags rf
     JOIN platform_survival_page_red_flags prf ON rf.id = prf.red_flag_id
     WHERE prf.page_id = $1
       AND rf.status = 'published'
       AND rf.archived_at IS NULL
     ORDER BY prf.display_order ASC`,
    [pageId],
  );

  return redFlags.map(toPublicPageRedFlag);
}

export async function getPublicRedFlag(redFlagId: string): Promise<PublicRedFlagDetail | null> {
  const redFlag = await queryOne<PublicRedFlagDetail>(
    `SELECT
       rf.id,
       rf.platform_id,
       rf.slug,
       rf.title,
       rf.category,
       rf.level,
       rf.summary,
       rf.why_it_matters
     FROM red_flags rf
     JOIN platform_survival_page_red_flags prf ON rf.id = prf.red_flag_id
     JOIN platform_survival_pages psp ON prf.page_id = psp.id
     JOIN platforms p ON rf.platform_id = p.id
     WHERE rf.id = $1
       AND rf.status = 'published'
       AND rf.archived_at IS NULL
       AND p.status = 'published'
       AND psp.archived_at IS NULL
       AND (psp.status = 'ready_for_publish' OR psp.ready_for_publish = true)
     LIMIT 1`,
    [redFlagId]
  );

  if (!redFlag) {
    return null;
  }

  return (await isPlatformPubliclyReady(redFlag.platform_id))
    ? toPublicRedFlagDetail(redFlag)
    : null;
}

export async function getPublicEvidence(redFlagId: string): Promise<Evidence[]> {
  return queryMany<Evidence>(
    `SELECT * FROM evidence WHERE red_flag_id = $1 AND status = 'approved' ORDER BY display_order ASC, sort_order ASC`,
    [redFlagId]
  );
}

export async function getPublicSurvivalNotes(redFlagId: string): Promise<SurvivalNote[]> {
  return queryMany<SurvivalNote>(
    `SELECT * FROM survival_notes WHERE red_flag_id = $1 AND status = 'published' ORDER BY display_order ASC`,
    [redFlagId]
  );
}

export async function getPublicBackupOptions(redFlagId: string): Promise<BackupOption[]> {
  return queryMany<BackupOption>(
    `SELECT * FROM backup_options WHERE red_flag_id = $1 AND status = 'published'`,
    [redFlagId]
  );
}

export async function getPublicChecklists(redFlagId: string): Promise<(Checklist & { items: ChecklistItem[] })[]> {
  const checklists = await queryMany<Checklist>(
    `SELECT * FROM checklists WHERE red_flag_id = $1 AND status = 'published'`,
    [redFlagId]
  );

  if (checklists.length === 0) return [];

  const checklistIds = checklists.map(c => c.id);
  const items = await queryMany<ChecklistItem>(
    `SELECT * FROM checklist_items WHERE checklist_id = ANY($1) AND status = 'published' ORDER BY display_order ASC, sort_order ASC`,
    [checklistIds]
  );

  return checklists.map(c => ({
    ...c,
    items: items.filter(i => i.checklist_id === c.id)
  }));
}

export async function getPublicResolutionRoutes(platformId: string): Promise<ResolutionRoute[]> {
  return queryMany<ResolutionRoute>(
    `SELECT *
     FROM resolution_routes
     WHERE platform_id = $1
       AND status = 'published'
       AND archived_at IS NULL
     ORDER BY display_order ASC, updated_at DESC`,
    [platformId],
  );
}

export async function getPublicDependencyScore(platformId: string): Promise<DependencyScore | null> {
  return queryOne<DependencyScore>(
    `SELECT *
     FROM dependency_scores
     WHERE platform_id = $1
       AND status = 'published'
       AND archived_at IS NULL
     ORDER BY generated_at DESC, updated_at DESC
     LIMIT 1`,
    [platformId],
  );
}

export async function getPublicRiskTimelines(platformId: string): Promise<RiskTimeline[]> {
  return queryMany<RiskTimeline>(
    `SELECT *
     FROM risk_timelines
     WHERE platform_id = $1
       AND status = 'published'
       AND archived_at IS NULL
     ORDER BY display_order ASC, updated_at DESC`,
    [platformId],
  );
}

export async function getPublicEvidenceConfidence(platformId: string): Promise<EvidenceConfidence | null> {
  return queryOne<EvidenceConfidence>(
    `SELECT *
     FROM evidence_confidence
     WHERE platform_id = $1
       AND status = 'published'
       AND archived_at IS NULL
     ORDER BY last_verified_at DESC NULLS LAST, updated_at DESC
     LIMIT 1`,
    [platformId],
  );
}

export type SearchResult = {
  type: 'platform' | 'red_flag';
  id: string;
  title: string;
  url: string;
  summary: string;
  platform_name: string;
};

export async function searchPublic(query: string): Promise<SearchResult[]> {
  const searchPattern = `%${query}%`;
  const results: SearchResult[] = [];

  // Search platforms
  const platforms = await queryMany<Platform>(
    `SELECT * FROM platforms WHERE status = 'published' AND (name ILIKE $1 OR slug ILIKE $1 OR summary ILIKE $1) LIMIT 10`,
    [searchPattern]
  );
  
  for (const p of platforms) {
    if (!(await isPlatformPubliclyReady(p.id))) {
      continue;
    }

    results.push({
      type: 'platform',
      id: p.id,
      title: p.name,
      url: `/platforms/${p.slug}`,
      summary: p.summary || '',
      platform_name: p.name
    });
  }

  // Search red flags. Must be attached to a published page.
  const redFlags = await queryMany<RedFlag & { platform_name: string }>(
    `SELECT rf.*, p.name as platform_name 
     FROM red_flags rf
     JOIN platforms p ON rf.platform_id = p.id
     JOIN platform_survival_pages psp ON p.id = psp.platform_id
     WHERE p.status = 'published' 
       AND rf.status = 'published'
       AND psp.archived_at IS NULL
       AND (psp.status = 'ready_for_publish' OR psp.ready_for_publish = true)
       AND rf.archived_at IS NULL
       AND (rf.title ILIKE $1 OR rf.category ILIKE $1 OR rf.summary ILIKE $1)
     LIMIT 10`,
    [searchPattern]
  );

  for (const rf of redFlags) {
    if (!(await isPlatformPubliclyReady(rf.platform_id))) {
      continue;
    }

    results.push({
      type: 'red_flag',
      id: rf.id,
      title: rf.title,
      url: `/red-flags/${rf.id}`, // TODO: Migrate to /platforms/[slug]/red-flags/[slug] since red flag slug is only unique per platform
      summary: rf.summary || '',
      platform_name: rf.platform_name
    });
  }

  return results;
}
