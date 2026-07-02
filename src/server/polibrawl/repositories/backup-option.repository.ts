import "server-only";

import { createCrudRepository } from "@/server/polibrawl/repositories/base.repository";
import type {
  BackupOption,
  BackupOptionListFilters,
  CreateBackupOptionDto,
  UpdateBackupOptionDto,
} from "@/types/polibrawl";

const backupOptionColumns = [
  "platform_id",
  "label",
  "option_type",
  "summary",
  "tradeoffs",
  "link_url",
  "status",
  "published_at",
  "archived_at",
] as const;

export const backupOptionRepository = createCrudRepository<
  BackupOption,
  CreateBackupOptionDto,
  UpdateBackupOptionDto,
  BackupOptionListFilters
>({
  tableName: "backup_options",
  insertableColumns: backupOptionColumns,
  updatableColumns: backupOptionColumns,
  filterableColumns: ["id", "platform_id", "status", "option_type"],
  defaultOrderBy: "updated_at desc",
  archive: {
    archivedAtColumn: "archived_at",
    statusColumn: "status",
    archivedStatusValue: "archived",
  },
});

export const listBackupOptions = backupOptionRepository.list;
export const findBackupOptionById = backupOptionRepository.findById;
export const findBackupOption = backupOptionRepository.findOne;
export const createBackupOption = backupOptionRepository.insert;
export const updateBackupOption = backupOptionRepository.update;
export const archiveBackupOption = backupOptionRepository.archive;
