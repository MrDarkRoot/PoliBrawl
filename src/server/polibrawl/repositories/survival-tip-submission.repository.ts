import "server-only";

import { createCrudRepository } from "@/server/polibrawl/repositories/base.repository";
import type {
  CreateSurvivalTipSubmissionDto,
  SurvivalTipSubmission,
  SurvivalTipSubmissionListFilters,
  UpdateSurvivalTipSubmissionDto,
} from "@/types/polibrawl";

const survivalTipSubmissionColumns = [
  "platform_id",
  "tip_summary",
  "details",
  "status",
  "reviewed_at",
  "published_at",
  "archived_at",
] as const;

export const survivalTipSubmissionRepository = createCrudRepository<
  SurvivalTipSubmission,
  CreateSurvivalTipSubmissionDto,
  UpdateSurvivalTipSubmissionDto,
  SurvivalTipSubmissionListFilters
>({
  tableName: "survival_tip_submissions",
  insertableColumns: survivalTipSubmissionColumns,
  updatableColumns: survivalTipSubmissionColumns,
  filterableColumns: ["id", "platform_id", "status"],
  defaultOrderBy: "created_at desc",
  archive: {
    archivedAtColumn: "archived_at",
  },
});

export const listSurvivalTipSubmissions = survivalTipSubmissionRepository.list;
export const findSurvivalTipSubmissionById = survivalTipSubmissionRepository.findById;
export const findSurvivalTipSubmission = survivalTipSubmissionRepository.findOne;
export const createSurvivalTipSubmission = survivalTipSubmissionRepository.insert;
export const updateSurvivalTipSubmission = survivalTipSubmissionRepository.update;
export const archiveSurvivalTipSubmission = survivalTipSubmissionRepository.archive;
