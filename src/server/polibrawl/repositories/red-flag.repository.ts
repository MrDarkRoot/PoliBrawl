import "server-only";

import { createCrudRepository } from "@/server/polibrawl/repositories/base.repository";
import type {
  CreateRedFlagDto,
  RedFlag,
  RedFlagListFilters,
  UpdateRedFlagDto,
} from "@/types/polibrawl";

const redFlagColumns = [
  "platform_id",
  "slug",
  "title",
  "category",
  "level",
  "summary",
  "why_it_matters",
  "status",
  "reviewed_at",
  "published_at",
  "archived_at",
] as const;

export const redFlagRepository = createCrudRepository<
  RedFlag,
  CreateRedFlagDto,
  UpdateRedFlagDto,
  RedFlagListFilters
>({
  tableName: "red_flags",
  insertableColumns: redFlagColumns,
  updatableColumns: redFlagColumns,
  filterableColumns: ["id", "platform_id", "slug", "status", "category", "level"],
  defaultOrderBy: "updated_at desc",
  slugColumn: "slug",
  archive: {
    archivedAtColumn: "archived_at",
    statusColumn: "status",
    archivedStatusValue: "archived",
  },
});

export const listRedFlags = redFlagRepository.list;
export const findRedFlagById = redFlagRepository.findById;
export const findRedFlagBySlug = redFlagRepository.findBySlug;
export const findRedFlag = redFlagRepository.findOne;
export const createRedFlag = redFlagRepository.insert;
export const updateRedFlag = redFlagRepository.update;
export const archiveRedFlag = redFlagRepository.archive;
