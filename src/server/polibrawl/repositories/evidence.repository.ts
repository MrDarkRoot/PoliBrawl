import "server-only";

import { createCrudRepository } from "@/server/polibrawl/repositories/base.repository";
import type {
  CreateEvidenceDto,
  EvidenceItem,
  EvidenceListFilters,
  UpdateEvidenceDto,
} from "@/types/polibrawl";

const evidenceColumns = [
  "red_flag_id",
  "source_id",
  "excerpt",
  "source_title",
  "source_url",
  "notes",
  "sort_order",
  "status",
  "reviewed_at",
  "published_at",
  "archived_at",
  "title",
  "source_snapshot_id",
  "keyword_match_id",
  "quoted_text",
  "reviewer",
  "confidence",
  "display_order",
  "internal_notes",
] as const;

export const evidenceRepository = createCrudRepository<
  EvidenceItem,
  CreateEvidenceDto,
  UpdateEvidenceDto,
  EvidenceListFilters
>({
  tableName: "evidence",
  insertableColumns: evidenceColumns,
  updatableColumns: evidenceColumns,
  filterableColumns: ["id", "red_flag_id", "source_id", "status"],
  defaultOrderBy: "red_flag_id asc, sort_order asc, updated_at desc",
  archive: {
    archivedAtColumn: "archived_at",
    statusColumn: "status",
    archivedStatusValue: "archived",
  },
});

export const listEvidence = evidenceRepository.list;
export const findEvidenceById = evidenceRepository.findById;
export const findEvidence = evidenceRepository.findOne;
export const createEvidence = evidenceRepository.insert;
export const updateEvidence = evidenceRepository.update;
export const archiveEvidence = evidenceRepository.archive;
