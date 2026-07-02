import "server-only";

import { createCrudRepository } from "@/server/polibrawl/repositories/base.repository";
import type {
  Checklist,
  ChecklistListFilters,
  CreateChecklistDto,
  UpdateChecklistDto,
} from "@/types/polibrawl";

const checklistColumns = [
  "platform_id",
  "title",
  "intro",
  "status",
  "published_at",
  "archived_at",
  "red_flag_id",
] as const;

export const checklistRepository = createCrudRepository<
  Checklist,
  CreateChecklistDto,
  UpdateChecklistDto,
  ChecklistListFilters
>({
  tableName: "checklists",
  insertableColumns: checklistColumns,
  updatableColumns: checklistColumns,
  filterableColumns: ["id", "platform_id", "status"],
  defaultOrderBy: "updated_at desc",
  archive: {
    archivedAtColumn: "archived_at",
    statusColumn: "status",
    archivedStatusValue: "archived",
  },
});

export const listChecklists = checklistRepository.list;
export const findChecklistById = checklistRepository.findById;
export const findChecklist = checklistRepository.findOne;
export const createChecklist = checklistRepository.insert;
export const updateChecklist = checklistRepository.update;
export const archiveChecklist = checklistRepository.archive;
