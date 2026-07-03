import "server-only";

import { queryMany, queryOne } from "@/server/polibrawl/db";
import { createCrudRepository } from "@/server/polibrawl/repositories/base.repository";
import type {
  CreateSourceDto,
  Source,
  SourceListFilters,
  SourceListItem,
  UpdateSourceDto,
  Uuid,
} from "@/types/polibrawl";

const sourceColumns = [
  "platform_id",
  "source_type",
  "priority",
  "title",
  "url",
  "body_text",
  "status",
  "notes",
  "last_checked_at",
  "last_reviewed_at",
  "captured_at",
  "reviewed_at",
  "archived_at",
  "preferred_acquisition_method",
  "last_acquisition_status",
  "last_acquisition_error",
  "acquisition_notes",
] as const;

const baseSourceSelect = `
  select
    s.*,
    p.name as platform_name,
    p.slug as platform_slug,
    latest.id as latest_snapshot_id,
    latest.capture_status as latest_capture_status,
    latest.title as latest_snapshot_title,
    latest.captured_at as latest_captured_at,
    latest.http_status as latest_http_status,
    latest.content_type as latest_content_type,
    latest.word_count as latest_word_count
  from sources s
  inner join platforms p on p.id = s.platform_id
  left join lateral (
    select
      ss.id,
      ss.capture_status,
      ss.title,
      ss.captured_at,
      ss.http_status,
      ss.content_type,
      ss.word_count
    from source_snapshots ss
    where ss.source_id = s.id
    order by ss.captured_at desc, ss.created_at desc
    limit 1
  ) latest on true
`;

export const sourceRepository = createCrudRepository<
  Source,
  CreateSourceDto,
  UpdateSourceDto,
  SourceListFilters
>({
  tableName: "sources",
  insertableColumns: sourceColumns,
  updatableColumns: sourceColumns,
  filterableColumns: ["id", "platform_id", "status", "priority", "source_type"],
  defaultOrderBy: "updated_at desc",
  archive: {
    archivedAtColumn: "archived_at",
    statusColumn: "status",
    archivedStatusValue: "archived",
  },
});

function buildSourceFilters(filters: SourceListFilters = {}) {
  const values: unknown[] = [];
  const clauses: string[] = [];

  if (filters.search) {
    values.push(`%${filters.search}%`);
    clauses.push(`(s.title ilike $${values.length} or coalesce(s.url, '') ilike $${values.length})`);
  }

  if (filters.id) {
    values.push(filters.id);
    clauses.push(`s.id = $${values.length}`);
  }

  if (filters.platform_id) {
    values.push(filters.platform_id);
    clauses.push(`s.platform_id = $${values.length}`);
  }

  if (filters.source_type) {
    values.push(filters.source_type);
    clauses.push(`s.source_type = $${values.length}`);
  }

  if (filters.priority) {
    values.push(filters.priority);
    clauses.push(`s.priority = $${values.length}`);
  }

  if (filters.status) {
    values.push(filters.status);
    clauses.push(`s.status = $${values.length}`);
  }

  return {
    values,
    whereClause: clauses.length > 0 ? `where ${clauses.join(" and ")}` : "",
  };
}

export async function listSources(filters: SourceListFilters = {}) {
  const { values, whereClause } = buildSourceFilters(filters);

  return queryMany<SourceListItem>(
    `${baseSourceSelect} ${whereClause} order by s.updated_at desc, s.title asc`,
    values,
  );
}

export async function countSources() {
  const result = await queryOne<{ count: string }>(
    "select count(*)::text as count from sources",
  );

  return Number(result?.count ?? 0);
}

export async function findSourceById(id: Uuid) {
  return sourceRepository.findById(id);
}

export async function findSourceRegistryById(id: Uuid) {
  return queryOne<SourceListItem>(
    `${baseSourceSelect} where s.id = $1 limit 1`,
    [id],
  );
}

export const findSource = sourceRepository.findOne;
export const createSource = sourceRepository.insert;
export const updateSource = sourceRepository.update;
export const archiveSource = sourceRepository.archive;
