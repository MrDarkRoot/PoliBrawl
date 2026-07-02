import "server-only";

import { createCrudRepository } from "@/server/polibrawl/repositories/base.repository";
import type {
  ChecklistItem,
  ChecklistItemListFilters,
  CreateChecklistItemDto,
  UpdateChecklistItemDto,
} from "@/types/polibrawl";

const checklistItemColumns = [
  "checklist_id",
  "label",
  "details",
  "sort_order",
  "status",
  "published_at",
  "archived_at",
] as const;

export const checklistItemRepository = createCrudRepository<
  ChecklistItem,
  CreateChecklistItemDto,
  UpdateChecklistItemDto,
  ChecklistItemListFilters
>({
  tableName: "checklist_items",
  insertableColumns: checklistItemColumns,
  updatableColumns: checklistItemColumns,
  filterableColumns: ["id", "checklist_id", "status"],
  defaultOrderBy: "checklist_id asc, sort_order asc, updated_at desc",
  archive: {
    archivedAtColumn: "archived_at",
    statusColumn: "status",
    archivedStatusValue: "archived",
  },
});

export const listChecklistItems = checklistItemRepository.list;
export const findChecklistItemById = checklistItemRepository.findById;
export const findChecklistItem = checklistItemRepository.findOne;
export const createChecklistItem = checklistItemRepository.insert;
export const updateChecklistItem = checklistItemRepository.update;
export const archiveChecklistItem = checklistItemRepository.archive;
