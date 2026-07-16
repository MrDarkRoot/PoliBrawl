import "server-only";

import { queryMany, queryOne } from "@/server/polibrawl/db";
import { createCrudRepository } from "@/server/polibrawl/repositories/base.repository";
import type {
  CreateEditorialDraftDto,
  EditorialDraft,
  EditorialDraftListFilters,
  UpdateEditorialDraftDto,
  Uuid,
} from "@/types/polibrawl";

const editorialDraftColumns = [
  "platform_id",
  "red_flag_id",
  "research_packet_id",
  "draft_type",
  "title",
  "summary",
  "who_is_affected",
  "why_it_matters",
  "survival_actions",
  "checklist_items",
  "backup_options",
  "evidence_summary",
  "evidence_reference_ids",
  "ai_confidence",
  "status",
  "reviewed_at",
  "published_at",
  "archived_at",
  // Sprint 10.5 — Editorial Intelligence Calibration
  "template_key",
  "generation_context",
  "critic_result",
  "quality_evaluation",
] as const;

export type EditorialDraftWithContext = EditorialDraft & {
  platform_name: string;
  platform_slug: string;
  research_packet_title: string;
  research_packet_status: string;
  red_flag_title: string | null;
};

export const editorialDraftRepository = createCrudRepository<
  EditorialDraft,
  CreateEditorialDraftDto,
  UpdateEditorialDraftDto,
  EditorialDraftListFilters
>({
  tableName: "editorial_drafts",
  insertableColumns: editorialDraftColumns,
  updatableColumns: editorialDraftColumns,
  filterableColumns: [
    "id",
    "platform_id",
    "red_flag_id",
    "research_packet_id",
    "draft_type",
    "status",
  ],
  defaultOrderBy: "updated_at desc",
  archive: {
    archivedAtColumn: "archived_at",
  },
});

export const listEditorialDrafts = editorialDraftRepository.list;
export const findEditorialDraftById = editorialDraftRepository.findById;
export const createEditorialDraft = editorialDraftRepository.insert;
export const updateEditorialDraft = editorialDraftRepository.update;

export async function listEditorialDraftsWithContext(
  filters: EditorialDraftListFilters = {},
  options: { limit?: number; offset?: number } = {},
) {
  const conditions = ["ed.archived_at is null"];
  const values: unknown[] = [];
  let index = 1;

  if (filters.id) {
    conditions.push(`ed.id = $${index++}`);
    values.push(filters.id);
  }

  if (filters.platform_id) {
    conditions.push(`ed.platform_id = $${index++}`);
    values.push(filters.platform_id);
  }

  if (filters.red_flag_id) {
    conditions.push(`ed.red_flag_id = $${index++}`);
    values.push(filters.red_flag_id);
  }

  if (filters.research_packet_id) {
    conditions.push(`ed.research_packet_id = $${index++}`);
    values.push(filters.research_packet_id);
  }

  if (filters.draft_type) {
    conditions.push(`ed.draft_type = $${index++}`);
    values.push(filters.draft_type);
  }

  if (filters.status) {
    conditions.push(`ed.status = $${index++}`);
    values.push(filters.status);
  }

  const limitClause =
    typeof options.limit === "number" ? ` limit $${index++}` : "";
  const offsetClause =
    typeof options.offset === "number" ? ` offset $${index++}` : "";

  if (typeof options.limit === "number") {
    values.push(options.limit);
  }

  if (typeof options.offset === "number") {
    values.push(options.offset);
  }

  return queryMany<EditorialDraftWithContext>(
    `select ed.*,
            p.name as platform_name,
            p.slug as platform_slug,
            rp.title as research_packet_title,
            rp.status as research_packet_status,
            rf.title as red_flag_title
     from editorial_drafts ed
     join platforms p on p.id = ed.platform_id
     join research_packets rp on rp.id = ed.research_packet_id
     left join red_flags rf on rf.id = ed.red_flag_id
     where ${conditions.join(" and ")}
     order by ed.updated_at desc${limitClause}${offsetClause}`,
    values,
  );
}

export async function findEditorialDraftWithContext(
  draftId: Uuid,
): Promise<EditorialDraftWithContext | null> {
  return queryOne<EditorialDraftWithContext>(
    `select ed.*,
            p.name as platform_name,
            p.slug as platform_slug,
            rp.title as research_packet_title,
            rp.status as research_packet_status,
            rf.title as red_flag_title
     from editorial_drafts ed
     join platforms p on p.id = ed.platform_id
     join research_packets rp on rp.id = ed.research_packet_id
     left join red_flags rf on rf.id = ed.red_flag_id
     where ed.id = $1
       and ed.archived_at is null
     limit 1`,
    [draftId],
  );
}
