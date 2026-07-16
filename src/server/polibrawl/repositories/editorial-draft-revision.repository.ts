import "server-only";

import { queryMany, queryOne } from "@/server/polibrawl/db";
import type { Uuid } from "@/types/polibrawl";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EditorialDraftRevisionType =
  | "ai_generated"
  | "critic_revised"
  | "human_edited"
  | "approved";

export type EditorialDraftActorType = "ai" | "system" | "human";

export type EditorialDraftRevision = {
  id: Uuid;
  editorial_draft_id: Uuid;
  revision_type: EditorialDraftRevisionType;
  content_snapshot: Record<string, unknown>;
  actor_type: EditorialDraftActorType;
  edit_distance_ratio: number | null;
  fields_changed: string[];
  created_at: string;
};

export type CreateEditorialDraftRevisionDto = {
  editorial_draft_id: Uuid;
  revision_type: EditorialDraftRevisionType;
  content_snapshot: Record<string, unknown>;
  actor_type: EditorialDraftActorType;
  edit_distance_ratio?: number | null;
  fields_changed?: string[];
};

// ─── Repository Functions ─────────────────────────────────────────────────────

export async function createEditorialDraftRevision(
  dto: CreateEditorialDraftRevisionDto,
): Promise<EditorialDraftRevision | null> {
  return queryOne<EditorialDraftRevision>(
    `insert into editorial_draft_revisions (
       editorial_draft_id,
       revision_type,
       content_snapshot,
       actor_type,
       edit_distance_ratio,
       fields_changed
     ) values ($1, $2, $3, $4, $5, $6)
     returning *`,
    [
      dto.editorial_draft_id,
      dto.revision_type,
      JSON.stringify(dto.content_snapshot),
      dto.actor_type,
      dto.edit_distance_ratio ?? null,
      dto.fields_changed ?? [],
    ],
  );
}

export async function listEditorialDraftRevisions(
  draftId: Uuid,
): Promise<EditorialDraftRevision[]> {
  return queryMany<EditorialDraftRevision>(
    `select * from editorial_draft_revisions
     where editorial_draft_id = $1
     order by created_at asc`,
    [draftId],
  );
}

/**
 * Find the original AI-generated revision for a draft.
 * Used as the baseline for edit-distance calculations.
 */
export async function findAiGeneratedRevision(
  draftId: Uuid,
): Promise<EditorialDraftRevision | null> {
  return queryOne<EditorialDraftRevision>(
    `select * from editorial_draft_revisions
     where editorial_draft_id = $1
       and revision_type = 'ai_generated'
     order by created_at asc
     limit 1`,
    [draftId],
  );
}

/**
 * Find the most recent revision of any type for a draft.
 */
export async function findLatestRevision(
  draftId: Uuid,
): Promise<EditorialDraftRevision | null> {
  return queryOne<EditorialDraftRevision>(
    `select * from editorial_draft_revisions
     where editorial_draft_id = $1
     order by created_at desc
     limit 1`,
    [draftId],
  );
}
