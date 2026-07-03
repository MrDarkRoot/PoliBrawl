import "server-only";

import { queryMany, queryOne } from "@/server/polibrawl/db";
import type { Platform, PlatformSurvivalPage, RedFlag, EvidenceItem as Evidence, SurvivalNote, BackupOption, Checklist, ChecklistItem } from "@/types/polibrawl";

export async function getPublicPlatforms(): Promise<Platform[]> {
  return queryMany<Platform>(
    `SELECT * FROM platforms WHERE status = 'published' ORDER BY name ASC`
  );
}

export async function getPublicPlatformBySlug(slug: string): Promise<Platform | null> {
  return queryOne<Platform>(
    `SELECT * FROM platforms WHERE slug = $1 AND status = 'published'`,
    [slug]
  );
}

export async function getPublicSurvivalPage(platformId: string): Promise<PlatformSurvivalPage | null> {
  return queryOne<PlatformSurvivalPage>(
    `SELECT * FROM platform_survival_pages WHERE platform_id = $1 AND (status = 'ready_for_publish' OR ready_for_publish = true) AND archived_at IS NULL`,
    [platformId]
  );
}

export async function getPublicRedFlags(pageId: string): Promise<(RedFlag & { section_label: string | null })[]> {
  return queryMany<RedFlag & { section_label: string | null }>(
    `SELECT rf.*, prf.section_label
     FROM red_flags rf
     JOIN platform_survival_page_red_flags prf ON rf.id = prf.red_flag_id
     WHERE prf.page_id = $1 AND rf.archived_at IS NULL
     ORDER BY prf.display_order ASC`,
    [pageId]
  );
}

export async function getPublicRedFlag(redFlagId: string): Promise<RedFlag | null> {
  return queryOne<RedFlag>(
    `SELECT * FROM red_flags WHERE id = $1 AND archived_at IS NULL`,
    [redFlagId]
  );
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
       AND (psp.status = 'ready_for_publish' OR psp.ready_for_publish = true)
       AND rf.archived_at IS NULL
       AND (rf.title ILIKE $1 OR rf.category ILIKE $1 OR rf.summary ILIKE $1)
     LIMIT 10`,
    [searchPattern]
  );

  for (const rf of redFlags) {
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
