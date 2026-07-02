import "server-only";

import { createCrudRepository } from "@/server/polibrawl/repositories/base.repository";
import type {
  CreateSourceDto,
  Source,
  SourceListFilters,
  UpdateSourceDto,
} from "@/types/polibrawl";

const sourceColumns = [
  "platform_id",
  "source_type",
  "priority",
  "title",
  "url",
  "body_text",
  "status",
  "notes",
  "captured_at",
  "reviewed_at",
  "archived_at",
] as const;

export const sourceRepository = createCrudRepository<
  Source,
  CreateSourceDto,
  UpdateSourceDto,
  SourceListFilters
>({
  tableName: "sources",
  insertableColumns: sourceColumns,
  updatableColumns: sourceColumns,
  filterableColumns: ["id", "platform_id", "status", "priority", "source_type"],
  defaultOrderBy: "updated_at desc",
  archive: {
    archivedAtColumn: "archived_at",
    statusColumn: "status",
    archivedStatusValue: "archived",
  },
});

export const listSources = sourceRepository.list;
export const findSourceById = sourceRepository.findById;
export const findSource = sourceRepository.findOne;
export const createSource = sourceRepository.insert;
export const updateSource = sourceRepository.update;
export const archiveSource = sourceRepository.archive;
