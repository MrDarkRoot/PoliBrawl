import "server-only";

import { createCrudRepository } from "@/server/polibrawl/repositories/base.repository";
import { queryMany, queryOne } from "@/server/polibrawl/db";
import type {
  CreateRedFlagCandidateDto,
  RedFlagCandidate,
  RedFlagCandidateListFilters,
  UpdateRedFlagCandidateDto,
  Uuid,
} from "@/types/polibrawl";

const candidateColumns = [
  "platform_id",
  "source_id",
  "source_snapshot_id",
  "primary_keyword_match_id",
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
  filterableColumns: [
    "id",
    "platform_id",
    "source_id",
    "source_snapshot_id",
    "status",
    "category",
  ],
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

/**
 * Count candidates belonging to a specific source snapshot.
 */
export async function countRedFlagCandidatesBySnapshot(
  sourceSnapshotId: Uuid,
): Promise<number> {
  const result = await queryOne<{ count: string }>(
    `select count(*) from red_flag_candidates where source_snapshot_id = $1`,
    [sourceSnapshotId],
  );
  return parseInt(result?.count ?? "0", 10);
}

/**
 * List candidates with joined platform/source names for the admin UI.
 */
export async function listRedFlagCandidatesWithContext(filters: {
  platform_id?: Uuid;
  source_id?: Uuid;
  source_snapshot_id?: Uuid;
  category?: string;
  status?: string;
}) {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (filters.platform_id) {
    conditions.push(`rfc.platform_id = $${idx++}`);
    values.push(filters.platform_id);
  }
  if (filters.source_id) {
    conditions.push(`rfc.source_id = $${idx++}`);
    values.push(filters.source_id);
  }
  if (filters.source_snapshot_id) {
    conditions.push(`rfc.source_snapshot_id = $${idx++}`);
    values.push(filters.source_snapshot_id);
  }
  if (filters.category) {
    conditions.push(`rfc.category = $${idx++}`);
    values.push(filters.category);
  }
  if (filters.status) {
    conditions.push(`rfc.status = $${idx++}`);
    values.push(filters.status);
  }

  const where =
    conditions.length > 0 ? `where ${conditions.join(" and ")}` : "";

  return queryMany<
    RedFlagCandidate & {
      platform_name: string;
      source_title: string;
    }
  >(
    `select
       rfc.*,
       p.name as platform_name,
       s.title as source_title
     from red_flag_candidates rfc
     inner join platforms p on p.id = rfc.platform_id
     inner join sources s on s.id = rfc.source_id
     ${where}
     order by rfc.created_at desc`,
    values,
  );
}

/**
 * Create a red‑flag candidate from a set of keyword matches.
 * All Sprint 4 traceability columns are populated here.
 */
export async function createCandidateFromKeywordMatches(input: {
  platformId: Uuid;
  sourceId: Uuid;
  sourceSnapshotId: Uuid;
  category: string;
  primaryKeywordMatchId: Uuid;
  matchedKeywords: string[];
  excerpt: string;
  suggestedTitle: string;
  suggestedLevel: string;
}): Promise<RedFlagCandidate> {
  const dto: CreateRedFlagCandidateDto = {
    platform_id: input.platformId,
    source_id: input.sourceId,
    source_snapshot_id: input.sourceSnapshotId,
    primary_keyword_match_id: input.primaryKeywordMatchId,
    category: input.category as RedFlagCandidate["category"],
    headline: input.suggestedTitle,
    excerpt: input.excerpt,
    matched_keywords: input.matchedKeywords,
    confidence_note: `Scanner level: ${input.suggestedLevel}`,
    reviewer_notes: null,
    status: "pending",
    reviewed_at: null,
  };

  const candidate = await createRedFlagCandidate(dto);
  if (!candidate) {
    throw new Error(
      `Failed to create candidate for category ${input.category}`,
    );
  }
  return candidate;
}
