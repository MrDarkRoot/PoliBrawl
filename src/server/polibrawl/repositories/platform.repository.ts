import "server-only";

import { createCrudRepository } from "@/server/polibrawl/repositories/base.repository";
import type {
  CreatePlatformDto,
  Platform,
  PlatformListFilters,
  UpdatePlatformDto,
} from "@/types/polibrawl";

const platformColumns = [
  "slug",
  "name",
  "category",
  "status",
  "website_url",
  "summary",
  "disclaimer_text",
  "internal_notes",
  "last_reviewed_at",
  "published_at",
  "archived_at",
] as const;

export const platformRepository = createCrudRepository<
  Platform,
  CreatePlatformDto,
  UpdatePlatformDto,
  PlatformListFilters
>({
  tableName: "platforms",
  insertableColumns: platformColumns,
  updatableColumns: platformColumns,
  filterableColumns: ["id", "slug", "status", "category"],
  defaultOrderBy: "updated_at desc",
  slugColumn: "slug",
  archive: {
    archivedAtColumn: "archived_at",
    statusColumn: "status",
    archivedStatusValue: "archived",
  },
});

export const listPlatforms = platformRepository.list;
export const findPlatformById = platformRepository.findById;
export const findPlatformBySlug = platformRepository.findBySlug;
export const findPlatform = platformRepository.findOne;
export const createPlatform = platformRepository.insert;
export const updatePlatform = platformRepository.update;
export const archivePlatform = platformRepository.archive;
