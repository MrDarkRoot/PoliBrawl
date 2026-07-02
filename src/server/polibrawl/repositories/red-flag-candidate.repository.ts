import "server-only";

import { createCrudRepository } from "@/server/polibrawl/repositories/base.repository";
import type {
  CreateRedFlagCandidateDto,
  RedFlagCandidate,
  RedFlagCandidateListFilters,
  UpdateRedFlagCandidateDto,
} from "@/types/polibrawl";

const candidateColumns = [
  "platform_id",
  "source_id",
  "category",
  "headline",
  "excerpt",
  "matched_keywords",
  "confidence_note",
  "reviewer_notes",
  "status",
  "reviewed_at",
  "archived_at",
] as const;

export const redFlagCandidateRepository = createCrudRepository<
  RedFlagCandidate,
  CreateRedFlagCandidateDto,
  UpdateRedFlagCandidateDto,
  RedFlagCandidateListFilters
>({
  tableName: "red_flag_candidates",
  insertableColumns: candidateColumns,
  updatableColumns: candidateColumns,
  filterableColumns: ["id", "platform_id", "source_id", "status", "category"],
  defaultOrderBy: "created_at desc",
  archive: {
    archivedAtColumn: "archived_at",
  },
});

export const listRedFlagCandidates = redFlagCandidateRepository.list;
export const findRedFlagCandidateById = redFlagCandidateRepository.findById;
export const findRedFlagCandidate = redFlagCandidateRepository.findOne;
export const createRedFlagCandidate = redFlagCandidateRepository.insert;
export const updateRedFlagCandidate = redFlagCandidateRepository.update;
export const archiveRedFlagCandidate = redFlagCandidateRepository.archive;
