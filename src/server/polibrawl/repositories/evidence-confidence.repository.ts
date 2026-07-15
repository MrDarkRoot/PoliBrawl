import "server-only";

import { queryMany, queryOne } from "@/server/polibrawl/db";
import { createCrudRepository } from "@/server/polibrawl/repositories/base.repository";
import type {
  CreateEvidenceConfidenceDto,
  EvidenceConfidence,
  EvidenceConfidenceListFilters,
  UpdateEvidenceConfidenceDto,
} from "@/types/polibrawl";

const evidenceConfidenceColumns = [
  "platform_id",
  "score",
  "factors",
  "last_verified_at",
  "status",
  "published_at",
  "archived_at",
] as const;

export const evidenceConfidenceRepository = createCrudRepository<
  EvidenceConfidence,
  CreateEvidenceConfidenceDto,
  UpdateEvidenceConfidenceDto,
  EvidenceConfidenceListFilters
>({
  tableName: "evidence_confidence",
  insertableColumns: evidenceConfidenceColumns,
  updatableColumns: evidenceConfidenceColumns,
  filterableColumns: ["id", "platform_id", "status"],
  defaultOrderBy: "last_verified_at desc nulls last, updated_at desc",
  archive: {
    archivedAtColumn: "archived_at",
    statusColumn: "status",
    archivedStatusValue: "archived",
  },
});

export const listEvidenceConfidenceRecords = evidenceConfidenceRepository.list;
export const findEvidenceConfidenceById = evidenceConfidenceRepository.findById;
export const createEvidenceConfidence = evidenceConfidenceRepository.insert;
export const updateEvidenceConfidence = evidenceConfidenceRepository.update;
export const archiveEvidenceConfidence = evidenceConfidenceRepository.archive;

export async function listEvidenceConfidenceByPlatform(platformId: string) {
  return queryMany<EvidenceConfidence>(
    `select *
     from evidence_confidence
     where platform_id = $1 and archived_at is null
     order by last_verified_at desc nulls last, updated_at desc`,
    [platformId],
  );
}

export async function findLatestEvidenceConfidenceByPlatform(platformId: string) {
  return queryOne<EvidenceConfidence>(
    `select *
     from evidence_confidence
     where platform_id = $1 and archived_at is null
     order by last_verified_at desc nulls last, updated_at desc
     limit 1`,
    [platformId],
  );
}
