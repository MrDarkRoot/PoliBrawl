import "server-only";

import { queryMany, queryOne } from "@/server/polibrawl/db";
import type {
  CreateSourceSnapshotDto,
  SourceSnapshot,
  SourceSnapshotDetail,
  Uuid,
} from "@/types/polibrawl";

const sourceSnapshotColumns = [
  "source_id",
  "capture_method",
  "original_url",
  "final_url",
  "http_status",
  "content_type",
  "content_hash",
  "title",
  "extracted_text",
  "text_preview",
  "word_count",
  "byte_size",
  "captured_at",
  "capture_status",
  "error_message",
] as const;

function pickColumns(input: Record<string, unknown>) {
  return Object.entries(input).filter(
    ([key, value]) => sourceSnapshotColumns.includes(key as (typeof sourceSnapshotColumns)[number]) && value !== undefined,
  );
}

export async function createSourceSnapshot(input: CreateSourceSnapshotDto) {
  const entries = pickColumns(input);

  if (entries.length === 0) {
    throw new Error("No insertable fields were provided for source_snapshots.");
  }

  const columns = entries.map(([key]) => key);
  const placeholders = entries.map((_, index) => `$${index + 1}`);
  const values = entries.map(([, value]) => value);

  return queryOne<SourceSnapshot>(
    `insert into source_snapshots (${columns.join(", ")}) values (${placeholders.join(", ")}) returning *`,
    values,
  );
}

export async function listSnapshotsBySource(sourceId: Uuid) {
  return queryMany<SourceSnapshot>(
    `select *
     from source_snapshots
     where source_id = $1
     order by captured_at desc, created_at desc`,
    [sourceId],
  );
}

export async function findSourceSnapshotById(snapshotId: Uuid) {
  return queryOne<SourceSnapshot>(
    `select *
     from source_snapshots
     where id = $1
     limit 1`,
    [snapshotId],
  );
}

export async function findLatestSnapshotForSource(sourceId: Uuid) {
  return queryOne<SourceSnapshot>(
    `select *
     from source_snapshots
     where source_id = $1
     order by captured_at desc, created_at desc
     limit 1`,
    [sourceId],
  );
}

export async function findSourceSnapshotDetailById(
  sourceId: Uuid,
  snapshotId: Uuid,
) {
  return queryOne<SourceSnapshotDetail>(
    `select
       ss.*,
       s.platform_id,
       p.name as platform_name,
       p.slug as platform_slug,
       s.title as source_title,
       s.url as source_registry_url,
       s.status as source_status,
       s.source_type,
       s.priority as source_priority
     from source_snapshots ss
     inner join sources s on s.id = ss.source_id
     inner join platforms p on p.id = s.platform_id
     where ss.id = $1
       and ss.source_id = $2
     limit 1`,
    [snapshotId, sourceId],
  );
}
