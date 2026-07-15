import "server-only";

import { queryMany, queryOne } from "@/server/polibrawl/db";
import { createCrudRepository } from "@/server/polibrawl/repositories/base.repository";
import type {
  CreateRiskTimelineDto,
  RiskTimeline,
  RiskTimelineListFilters,
  UpdateRiskTimelineDto,
} from "@/types/polibrawl";

const riskTimelineColumns = [
  "platform_id",
  "title",
  "events",
  "source",
  "status",
  "published_at",
  "display_order",
  "archived_at",
] as const;

export const riskTimelineRepository = createCrudRepository<
  RiskTimeline,
  CreateRiskTimelineDto,
  UpdateRiskTimelineDto,
  RiskTimelineListFilters
>({
  tableName: "risk_timelines",
  insertableColumns: riskTimelineColumns,
  updatableColumns: riskTimelineColumns,
  filterableColumns: ["id", "platform_id", "status"],
  defaultOrderBy: "display_order asc, updated_at desc",
  archive: {
    archivedAtColumn: "archived_at",
    statusColumn: "status",
    archivedStatusValue: "archived",
  },
});

export const listRiskTimelines = riskTimelineRepository.list;
export const findRiskTimelineById = riskTimelineRepository.findById;
export const createRiskTimeline = riskTimelineRepository.insert;
export const updateRiskTimeline = riskTimelineRepository.update;
export const archiveRiskTimeline = riskTimelineRepository.archive;

export async function listRiskTimelinesByPlatform(platformId: string) {
  return queryMany<RiskTimeline>(
    `select *
     from risk_timelines
     where platform_id = $1 and archived_at is null
     order by display_order asc, updated_at desc`,
    [platformId],
  );
}

export async function getMaxRiskTimelineDisplayOrder(platformId: string) {
  const result = await queryOne<{ max_display_order: number | null }>(
    `select max(display_order) as max_display_order
     from risk_timelines
     where platform_id = $1 and archived_at is null`,
    [platformId],
  );

  return result?.max_display_order ?? -1;
}
