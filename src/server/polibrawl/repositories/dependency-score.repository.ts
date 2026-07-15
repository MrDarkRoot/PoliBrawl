import "server-only";

import { queryMany, queryOne } from "@/server/polibrawl/db";
import { createCrudRepository } from "@/server/polibrawl/repositories/base.repository";
import type {
  CreateDependencyScoreDto,
  DependencyScore,
  DependencyScoreListFilters,
  UpdateDependencyScoreDto,
} from "@/types/polibrawl";

const dependencyScoreColumns = [
  "platform_id",
  "score",
  "risk_level",
  "factors",
  "explanation",
  "generated_at",
  "status",
  "published_at",
  "archived_at",
] as const;

export const dependencyScoreRepository = createCrudRepository<
  DependencyScore,
  CreateDependencyScoreDto,
  UpdateDependencyScoreDto,
  DependencyScoreListFilters
>({
  tableName: "dependency_scores",
  insertableColumns: dependencyScoreColumns,
  updatableColumns: dependencyScoreColumns,
  filterableColumns: ["id", "platform_id", "status", "risk_level"],
  defaultOrderBy: "generated_at desc, updated_at desc",
  archive: {
    archivedAtColumn: "archived_at",
    statusColumn: "status",
    archivedStatusValue: "archived",
  },
});

export const listDependencyScores = dependencyScoreRepository.list;
export const findDependencyScoreById = dependencyScoreRepository.findById;
export const createDependencyScore = dependencyScoreRepository.insert;
export const updateDependencyScore = dependencyScoreRepository.update;
export const archiveDependencyScore = dependencyScoreRepository.archive;

export async function listDependencyScoresByPlatform(platformId: string) {
  return queryMany<DependencyScore>(
    `select *
     from dependency_scores
     where platform_id = $1 and archived_at is null
     order by generated_at desc, updated_at desc`,
    [platformId],
  );
}

export async function findLatestDependencyScoreByPlatform(platformId: string) {
  return queryOne<DependencyScore>(
    `select *
     from dependency_scores
     where platform_id = $1 and archived_at is null
     order by generated_at desc, updated_at desc
     limit 1`,
    [platformId],
  );
}
