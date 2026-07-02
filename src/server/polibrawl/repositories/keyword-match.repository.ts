// Keyword Match Repository
import "server-only";

import { createCrudRepository } from "@/server/polibrawl/repositories/base.repository";
import type {
  KeywordMatch,
  CreateKeywordMatchDto,
  UpdateKeywordMatchDto,
  KeywordMatchListFilters,
} from "@/types/polibrawl";

// Columns that can be inserted/updated. Exclude immutable fields like id, created_at, updated_at.
const keywordMatchColumns = [
  "source_snapshot_id",
  "source_id",
  "platform_id",
  "category",
  "keyword",
  "matched_text",
  "excerpt",
  "context_before",
  "context_after",
  "start_offset",
  "end_offset",
  "confidence",
  "noise_score",
  "status",
  "candidate_id",
] as const;

export const keywordMatchRepository = createCrudRepository<
  KeywordMatch,
  CreateKeywordMatchDto,
  UpdateKeywordMatchDto,
  KeywordMatchListFilters
>({
  tableName: "keyword_matches",
  insertableColumns: keywordMatchColumns,
  updatableColumns: keywordMatchColumns,
  filterableColumns: [
    "id",
    "source_snapshot_id",
    "source_id",
    "platform_id",
    "category",
    "keyword",
    "status",
  ],
  defaultOrderBy: "created_at desc",
  archive: {
    archivedAtColumn: "updated_at", // Using updated_at as placeholder; actual archiving via status.
  },
});

export const listKeywordMatches = keywordMatchRepository.list;
export const findKeywordMatchById = keywordMatchRepository.findById;
export const findKeywordMatch = keywordMatchRepository.findOne;
export const createKeywordMatch = keywordMatchRepository.insert;
export const updateKeywordMatch = keywordMatchRepository.update;
export const archiveKeywordMatch = keywordMatchRepository.archive;
