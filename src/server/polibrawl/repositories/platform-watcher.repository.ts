import "server-only";

import { createCrudRepository } from "@/server/polibrawl/repositories/base.repository";
import type {
  CreatePlatformWatcherDto,
  PlatformWatcher,
  PlatformWatcherListFilters,
  UpdatePlatformWatcherDto,
} from "@/types/polibrawl";

const platformWatcherColumns = [
  "platform_id",
  "email",
  "status",
  "subscribed_at",
  "unsubscribed_at",
  "archived_at",
] as const;

export const platformWatcherRepository = createCrudRepository<
  PlatformWatcher,
  CreatePlatformWatcherDto,
  UpdatePlatformWatcherDto,
  PlatformWatcherListFilters
>({
  tableName: "platform_watchers",
  insertableColumns: platformWatcherColumns,
  updatableColumns: platformWatcherColumns,
  filterableColumns: ["id", "platform_id", "status"],
  defaultOrderBy: "created_at desc",
  archive: {
    archivedAtColumn: "archived_at",
  },
});

export const listPlatformWatchers = platformWatcherRepository.list;
export const findPlatformWatcherById = platformWatcherRepository.findById;
export const findPlatformWatcher = platformWatcherRepository.findOne;
export const createPlatformWatcher = platformWatcherRepository.insert;
export const updatePlatformWatcher = platformWatcherRepository.update;
export const archivePlatformWatcher = platformWatcherRepository.archive;
