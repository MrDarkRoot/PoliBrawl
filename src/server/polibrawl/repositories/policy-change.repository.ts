import "server-only";

import { queryMany, queryOne } from "@/server/polibrawl/db";
import { createCrudRepository } from "@/server/polibrawl/repositories/base.repository";
import type {
  CreatePolicyChangeDto,
  PolicyChange,
  PolicyChangeListFilters,
  UpdatePolicyChangeDto,
} from "@/types/polibrawl";

const policyChangeColumns = [
  "platform_id",
  "source_id",
  "old_snapshot_id",
  "new_snapshot_id",
  "change_type",
  "summary",
  "impact_level",
  "published_status",
  "what_changed",
  "who_is_affected",
  "why_it_matters",
  "what_to_do",
  "reviewed_at",
  "published_at",
  "archived_at",
  "policy_source_id",
  "old_version_id",
  "new_version_id",
  "old_hash",
  "new_hash",
  "detected_at",
  "status",
  "importance",
  "reviewed_by",
] as const;

export const policyChangeRepository = createCrudRepository<
  PolicyChange,
  CreatePolicyChangeDto,
  UpdatePolicyChangeDto,
  PolicyChangeListFilters
>({
  tableName: "policy_changes",
  insertableColumns: policyChangeColumns,
  updatableColumns: policyChangeColumns,
  filterableColumns: [
    "id",
    "platform_id",
    "source_id",
    "published_status",
    "impact_level",
  ],
  defaultOrderBy: "coalesce(published_at, reviewed_at, created_at) desc, updated_at desc",
  archive: {
    archivedAtColumn: "archived_at",
    statusColumn: "published_status",
    archivedStatusValue: "archived",
  },
});

export const listPolicyChanges = policyChangeRepository.list;
export const findPolicyChangeById = policyChangeRepository.findById;
export const createPolicyChangeRecord = policyChangeRepository.insert;
export const updatePolicyChangeRecord = policyChangeRepository.update;
export const archivePolicyChangeRecord = policyChangeRepository.archive;

export async function listPolicyChangesByPlatform(platformId: string) {
  return queryMany<PolicyChange>(
    `select *
     from policy_changes
     where platform_id = $1
       and archived_at is null
     order by coalesce(published_at, reviewed_at, created_at) desc, updated_at desc`,
    [platformId],
  );
}

export async function findLatestPublishedPolicyChangeByPlatform(platformId: string) {
  return queryOne<PolicyChange>(
    `select *
     from policy_changes
     where platform_id = $1
       and published_status = 'published'
       and archived_at is null
     order by coalesce(published_at, reviewed_at, created_at) desc, updated_at desc
     limit 1`,
    [platformId],
  );
}
