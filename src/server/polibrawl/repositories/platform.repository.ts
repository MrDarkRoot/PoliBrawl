import "server-only";

import { queryMany, queryOne } from "@/server/polibrawl/db";
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
  "main_level",
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

export async function listPlatforms(filters: PlatformListFilters = {}) {
  const values: unknown[] = [];
  const clauses: string[] = [];

  if (filters.search) {
    values.push(`%${filters.search}%`);
    clauses.push(`(name ilike $${values.length} or slug ilike $${values.length})`);
  }

  if (filters.category) {
    values.push(filters.category);
    clauses.push(`category = $${values.length}`);
  }

  if (filters.status) {
    values.push(filters.status);
    clauses.push(`status = $${values.length}`);
  }

  if (filters.slug) {
    values.push(filters.slug);
    clauses.push(`slug = $${values.length}`);
  }

  if (filters.id) {
    values.push(filters.id);
    clauses.push(`id = $${values.length}`);
  }

  const whereClause = clauses.length > 0 ? `where ${clauses.join(" and ")}` : "";

  return queryMany<Platform>(
    `select * from platforms ${whereClause} order by updated_at desc`,
    values,
  );
}

export async function countPlatforms() {
  const result = await queryOne<{ count: string }>(
    "select count(*)::text as count from platforms",
  );

  return Number(result?.count ?? 0);
}

export const findPlatformById = platformRepository.findById;
export const findPlatformBySlug = platformRepository.findBySlug;
export const findPlatform = platformRepository.findOne;
export const createPlatform = platformRepository.insert;
export const updatePlatform = platformRepository.update;
export const archivePlatform = platformRepository.archive;
