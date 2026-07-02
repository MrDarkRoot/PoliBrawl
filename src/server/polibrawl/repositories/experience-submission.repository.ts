import "server-only";

import { createCrudRepository } from "@/server/polibrawl/repositories/base.repository";
import type {
  CreateExperienceSubmissionDto,
  ExperienceSubmission,
  ExperienceSubmissionListFilters,
  UpdateExperienceSubmissionDto,
} from "@/types/polibrawl";

const experienceSubmissionColumns = [
  "platform_id",
  "category",
  "summary",
  "country",
  "amount_range",
  "evidence_note",
  "status",
  "reviewed_at",
  "published_at",
  "archived_at",
] as const;

export const experienceSubmissionRepository = createCrudRepository<
  ExperienceSubmission,
  CreateExperienceSubmissionDto,
  UpdateExperienceSubmissionDto,
  ExperienceSubmissionListFilters
>({
  tableName: "experience_submissions",
  insertableColumns: experienceSubmissionColumns,
  updatableColumns: experienceSubmissionColumns,
  filterableColumns: ["id", "platform_id", "status", "category"],
  defaultOrderBy: "created_at desc",
  archive: {
    archivedAtColumn: "archived_at",
  },
});

export const listExperienceSubmissions = experienceSubmissionRepository.list;
export const findExperienceSubmissionById = experienceSubmissionRepository.findById;
export const findExperienceSubmission = experienceSubmissionRepository.findOne;
export const createExperienceSubmission = experienceSubmissionRepository.insert;
export const updateExperienceSubmission = experienceSubmissionRepository.update;
export const archiveExperienceSubmission = experienceSubmissionRepository.archive;
