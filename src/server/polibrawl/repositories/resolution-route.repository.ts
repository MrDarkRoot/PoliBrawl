import "server-only";

import { queryMany, queryOne } from "@/server/polibrawl/db";
import { createCrudRepository } from "@/server/polibrawl/repositories/base.repository";
import type {
  CreateResolutionRouteDto,
  ResolutionRoute,
  ResolutionRouteListFilters,
  UpdateResolutionRouteDto,
} from "@/types/polibrawl";

const resolutionRouteColumns = [
  "platform_id",
  "organization_name",
  "organization_type",
  "country",
  "jurisdiction",
  "official_url",
  "eligible_users",
  "eligible_disputes",
  "requirements",
  "steps",
  "fees",
  "limits",
  "deadline",
  "verification_source",
  "last_verified_at",
  "status",
  "published_at",
  "display_order",
  "archived_at",
] as const;

export const resolutionRouteRepository = createCrudRepository<
  ResolutionRoute,
  CreateResolutionRouteDto,
  UpdateResolutionRouteDto,
  ResolutionRouteListFilters
>({
  tableName: "resolution_routes",
  insertableColumns: resolutionRouteColumns,
  updatableColumns: resolutionRouteColumns,
  filterableColumns: ["id", "platform_id", "status"],
  defaultOrderBy: "display_order asc, updated_at desc",
  archive: {
    archivedAtColumn: "archived_at",
    statusColumn: "status",
    archivedStatusValue: "archived",
  },
});

export const listResolutionRoutes = resolutionRouteRepository.list;
export const findResolutionRouteById = resolutionRouteRepository.findById;
export const createResolutionRoute = resolutionRouteRepository.insert;
export const updateResolutionRoute = resolutionRouteRepository.update;
export const archiveResolutionRoute = resolutionRouteRepository.archive;

export async function listResolutionRoutesByPlatform(platformId: string) {
  return queryMany<ResolutionRoute>(
    `select *
     from resolution_routes
     where platform_id = $1 and archived_at is null
     order by display_order asc, updated_at desc`,
    [platformId],
  );
}

export async function getMaxResolutionRouteDisplayOrder(platformId: string) {
  const result = await queryOne<{ max_display_order: number | null }>(
    `select max(display_order) as max_display_order
     from resolution_routes
     where platform_id = $1 and archived_at is null`,
    [platformId],
  );

  return result?.max_display_order ?? -1;
}
