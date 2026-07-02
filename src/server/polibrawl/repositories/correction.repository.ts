import "server-only";

import { createCrudRepository } from "@/server/polibrawl/repositories/base.repository";
import type {
  Correction,
  CorrectionListFilters,
  CreateCorrectionDto,
  UpdateCorrectionDto,
} from "@/types/polibrawl";

const correctionColumns = [
  "platform_id",
  "issue_type",
  "message",
  "source_url",
  "contact_email",
  "status",
  "reviewed_at",
  "resolved_at",
  "archived_at",
] as const;

export const correctionRepository = createCrudRepository<
  Correction,
  CreateCorrectionDto,
  UpdateCorrectionDto,
  CorrectionListFilters
>({
  tableName: "corrections",
  insertableColumns: correctionColumns,
  updatableColumns: correctionColumns,
  filterableColumns: ["id", "platform_id", "status", "issue_type"],
  defaultOrderBy: "created_at desc",
  archive: {
    archivedAtColumn: "archived_at",
  },
});

export const listCorrections = correctionRepository.list;
export const findCorrectionById = correctionRepository.findById;
export const findCorrection = correctionRepository.findOne;
export const createCorrection = correctionRepository.insert;
export const updateCorrection = correctionRepository.update;
export const archiveCorrection = correctionRepository.archive;
