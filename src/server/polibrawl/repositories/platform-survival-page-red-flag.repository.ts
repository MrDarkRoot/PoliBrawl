import { queryMany, queryOne } from "@/server/polibrawl/db";
import type { PlatformSurvivalPageRedFlag, RedFlag } from "@/types/polibrawl";

export async function listPageRedFlags(pageId: string): Promise<(PlatformSurvivalPageRedFlag & { red_flag: RedFlag })[]> {
  const joins = await queryMany<PlatformSurvivalPageRedFlag & { red_flag_id_alias: string }>(
    `SELECT j.* FROM platform_survival_page_red_flags j WHERE j.page_id = $1 ORDER BY j.display_order ASC`,
    [pageId]
  );
  if (joins.length === 0) return [];
  
  const rfIds = joins.map((j) => j.red_flag_id);
  const flags = await queryMany<RedFlag>(
    `SELECT * FROM red_flags WHERE id = ANY($1)`,
    [rfIds]
  );
  const flagMap = new Map(flags.map((f) => [f.id, f]));
  
  return joins.map((j) => ({
    ...j,
    red_flag: flagMap.get(j.red_flag_id)!
  })).filter((j) => j.red_flag && j.red_flag.status !== 'archived');
}

export async function addRedFlagToPage(pageId: string, redFlagId: string, displayOrder: number = 0): Promise<PlatformSurvivalPageRedFlag> {
  const [res] = await queryMany<PlatformSurvivalPageRedFlag>(
    `INSERT INTO platform_survival_page_red_flags (page_id, red_flag_id, display_order) 
     VALUES ($1, $2, $3) 
     ON CONFLICT (page_id, red_flag_id) DO UPDATE SET updated_at = now() 
     RETURNING *`,
    [pageId, redFlagId, displayOrder]
  );
  return res;
}

export async function removeRedFlagFromPage(pageId: string, redFlagId: string): Promise<void> {
  await queryOne(
    `DELETE FROM platform_survival_page_red_flags WHERE page_id = $1 AND red_flag_id = $2`,
    [pageId, redFlagId]
  );
}

export async function countPageRedFlags(pageId: string): Promise<number> {
  const res = await queryMany<{ count: string }>(
    `SELECT COUNT(*) FROM platform_survival_page_red_flags WHERE page_id = $1`,
    [pageId]
  );
  return parseInt(res[0].count, 10);
}

export async function reorderPageRedFlags(pageId: string, orderedRedFlagIds: string[]): Promise<void> {
  for (let i = 0; i < orderedRedFlagIds.length; i++) {
    await queryOne(
      `UPDATE platform_survival_page_red_flags SET display_order = $1, updated_at = now() WHERE page_id = $2 AND red_flag_id = $3`,
      [i, pageId, orderedRedFlagIds[i]]
    );
  }
}
