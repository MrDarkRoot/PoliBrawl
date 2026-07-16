-- Sprint 10.5 — Editorial Intelligence Calibration
-- Additive migration: adds quality_evaluation, critic_result, template_key,
-- generation_context JSONB columns to editorial_drafts, and creates the
-- editorial_draft_revisions audit table.
-- This migration is idempotent (uses IF NOT EXISTS / IF NOT EXISTS column guards).

-- ============================================================
-- 1. Additive columns on editorial_drafts
-- ============================================================

alter table editorial_drafts
  add column if not exists template_key text,
  add column if not exists generation_context jsonb,
  add column if not exists critic_result jsonb,
  add column if not exists quality_evaluation jsonb;

-- Optional: index on template_key for analytics queries
create index if not exists idx_editorial_drafts_template_key
  on editorial_drafts (template_key, updated_at desc);

-- ============================================================
-- 2. editorial_draft_revisions — edit-distance and audit log
-- ============================================================

create table if not exists editorial_draft_revisions (
  id uuid primary key default gen_random_uuid(),
  editorial_draft_id uuid not null references editorial_drafts(id) on delete cascade,
  -- revision_type identifies the origin of this snapshot
  revision_type text not null check (
    revision_type in ('ai_generated', 'critic_revised', 'human_edited', 'approved')
  ),
  -- content_snapshot stores the full structured content at the time of this revision
  content_snapshot jsonb not null,
  -- actor_type records who or what created this revision
  actor_type text not null check (
    actor_type in ('ai', 'system', 'human')
  ),
  -- edit_distance_ratio is calculated by the application layer (0.0 = no change, 1.0 = full rewrite)
  -- null on ai_generated revisions (no prior to compare against)
  edit_distance_ratio numeric(5, 4),
  -- fields_changed lists which structured fields were modified vs the previous revision
  fields_changed text[] not null default '{}'::text[],
  created_at timestamptz not null default now()
);

create index if not exists idx_editorial_draft_revisions_draft_id
  on editorial_draft_revisions (editorial_draft_id, created_at desc);

create index if not exists idx_editorial_draft_revisions_revision_type
  on editorial_draft_revisions (revision_type, created_at desc);
