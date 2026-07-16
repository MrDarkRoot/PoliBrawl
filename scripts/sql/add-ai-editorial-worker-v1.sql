create table if not exists editorial_drafts (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid not null references platforms(id) on delete restrict,
  red_flag_id uuid references red_flags(id) on delete set null,
  research_packet_id uuid not null references research_packets(id) on delete restrict,
  draft_type text not null check (
    draft_type in ('platform_survival_guide', 'red_flag_analysis', 'policy_change_summary')
  ),
  title text not null,
  summary text not null,
  who_is_affected text[] not null default '{}'::text[],
  why_it_matters text not null,
  survival_actions text[] not null default '{}'::text[],
  checklist_items text[] not null default '{}'::text[],
  backup_options jsonb not null default '[]'::jsonb,
  evidence_summary text not null,
  evidence_reference_ids uuid[] not null default '{}'::uuid[],
  ai_confidence integer not null check (ai_confidence >= 0 and ai_confidence <= 100),
  status text not null default 'draft' check (
    status in ('draft', 'review_requested', 'approved', 'published', 'rejected')
  ),
  reviewed_at timestamptz,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint editorial_drafts_backup_options_array_check
    check (jsonb_typeof(backup_options) = 'array'),
  constraint editorial_drafts_published_status_check
    check (published_at is null or status = 'published')
);

create index if not exists idx_editorial_drafts_platform_id
  on editorial_drafts (platform_id, updated_at desc);
create index if not exists idx_editorial_drafts_research_packet_id
  on editorial_drafts (research_packet_id, updated_at desc);
create index if not exists idx_editorial_drafts_red_flag_id
  on editorial_drafts (red_flag_id, updated_at desc);
create index if not exists idx_editorial_drafts_status
  on editorial_drafts (status, updated_at desc);
create index if not exists idx_editorial_drafts_draft_type
  on editorial_drafts (draft_type, updated_at desc);
create index if not exists idx_editorial_drafts_evidence_reference_ids
  on editorial_drafts using gin (evidence_reference_ids);

drop trigger if exists trg_polibrawl_editorial_drafts_updated_at on editorial_drafts;
create trigger trg_polibrawl_editorial_drafts_updated_at
before update on editorial_drafts
for each row execute function set_polibrawl_updated_at();
