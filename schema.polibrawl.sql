create extension if not exists pgcrypto;

create or replace function set_polibrawl_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists platforms (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  category text not null check (category in ('payment', 'creator_freelance', 'saas_developer')),
  status text not null default 'draft' check (status in ('draft', 'published', 'needs_review', 'archived')),
  website_url text not null,
  summary text,
  main_level text check (main_level in ('low', 'medium', 'high', 'critical', 'unknown')),
  disclaimer_text text,
  internal_notes text,
  last_reviewed_at timestamptz,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platforms_published_status_check
    check (published_at is null or status = 'published')
);

alter table if exists platforms add column if not exists summary text;
alter table if exists platforms add column if not exists main_level text;
alter table if exists platforms add column if not exists disclaimer_text text;
alter table if exists platforms add column if not exists internal_notes text;
alter table if exists platforms add column if not exists last_reviewed_at timestamptz;
alter table if exists platforms add column if not exists published_at timestamptz;
alter table if exists platforms add column if not exists archived_at timestamptz;
alter table if exists platforms add column if not exists updated_at timestamptz not null default now();

alter table if exists platforms drop constraint if exists platforms_category_check;
alter table if exists platforms drop constraint if exists platforms_status_check;
alter table if exists platforms drop constraint if exists platforms_main_level_check;
alter table if exists platforms drop constraint if exists platforms_published_status_check;

update platforms
set category = 'saas_developer'
where category = 'saas_vendor';

update platforms
set status = 'published'
where status = 'active';

alter table if exists platforms
  add constraint platforms_category_check
    check (category in ('payment', 'creator_freelance', 'saas_developer'));

alter table if exists platforms
  add constraint platforms_status_check
    check (status in ('draft', 'published', 'needs_review', 'archived'));

alter table if exists platforms
  add constraint platforms_main_level_check
    check (main_level is null or main_level in ('low', 'medium', 'high', 'critical', 'unknown'));

alter table if exists platforms
  add constraint platforms_published_status_check
    check (published_at is null or status = 'published');

create unique index if not exists idx_platforms_slug_unique on platforms (slug);
create index if not exists idx_platforms_status on platforms (status);
create index if not exists idx_platforms_category on platforms (category);
create index if not exists idx_platforms_main_level on platforms (main_level);
create index if not exists idx_platforms_last_reviewed_at on platforms (last_reviewed_at desc nulls last);

drop trigger if exists trg_polibrawl_platforms_updated_at on platforms;
create trigger trg_polibrawl_platforms_updated_at
before update on platforms
for each row execute function set_polibrawl_updated_at();

create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid not null references platforms(id) on delete restrict,
  source_type text not null check (source_type in ('terms', 'user_agreement', 'payment_terms', 'payout_terms', 'account_limits', 'kyc_verification', 'refund_chargeback', 'developer_api', 'privacy_data', 'pricing_fees', 'appeals', 'other')),
  priority text not null default 'supporting' check (priority in ('core', 'supporting', 'ignore')),
  title text not null,
  url text,
  body_text text,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived', 'failed_capture')),
  notes text,
  last_checked_at timestamptz,
  last_reviewed_at timestamptz,
  captured_at timestamptz,
  reviewed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists sources add column if not exists body_text text;
alter table if exists sources add column if not exists notes text;
alter table if exists sources add column if not exists last_checked_at timestamptz;
alter table if exists sources add column if not exists last_reviewed_at timestamptz;
alter table if exists sources add column if not exists captured_at timestamptz;
alter table if exists sources add column if not exists reviewed_at timestamptz;
alter table if exists sources add column if not exists archived_at timestamptz;
alter table if exists sources add column if not exists updated_at timestamptz not null default now();

update sources
set source_type = case source_type
  when 'policy' then 'terms'
  when 'help_center' then 'other'
  when 'payout_policy' then 'payout_terms'
  when 'account_policy' then 'account_limits'
  when 'api_policy' then 'developer_api'
  when 'appeals_policy' then 'appeals'
  else source_type
end
where source_type in (
  'policy',
  'help_center',
  'payout_policy',
  'account_policy',
  'api_policy',
  'appeals_policy'
);

update sources
set last_checked_at = captured_at
where last_checked_at is null
  and captured_at is not null;

update sources
set last_reviewed_at = reviewed_at
where last_reviewed_at is null
  and reviewed_at is not null;

alter table if exists sources drop constraint if exists sources_source_type_check;
alter table if exists sources drop constraint if exists sources_priority_check;
alter table if exists sources drop constraint if exists sources_status_check;

alter table if exists sources
  add constraint sources_source_type_check
    check (source_type in ('terms', 'user_agreement', 'payment_terms', 'payout_terms', 'account_limits', 'kyc_verification', 'refund_chargeback', 'developer_api', 'privacy_data', 'pricing_fees', 'appeals', 'other'));

alter table if exists sources
  add constraint sources_priority_check
    check (priority in ('core', 'supporting', 'ignore'));

alter table if exists sources
  add constraint sources_status_check
    check (status in ('draft', 'active', 'archived', 'failed_capture'));

create unique index if not exists idx_sources_platform_url_unique
  on sources (platform_id, lower(url))
  where url is not null;
create index if not exists idx_sources_platform_id on sources (platform_id);
create index if not exists idx_sources_status on sources (status);
create index if not exists idx_sources_priority on sources (priority);
create index if not exists idx_sources_source_type on sources (source_type);
create index if not exists idx_sources_last_checked_at on sources (last_checked_at desc nulls last);
create index if not exists idx_sources_last_reviewed_at on sources (last_reviewed_at desc nulls last);
create index if not exists idx_sources_reviewed_at on sources (reviewed_at desc nulls last);

drop trigger if exists trg_polibrawl_sources_updated_at on sources;
create trigger trg_polibrawl_sources_updated_at
before update on sources
for each row execute function set_polibrawl_updated_at();

create table if not exists source_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references sources(id) on delete restrict,
  capture_method text not null check (capture_method in ('fetch', 'paste')),
  original_url text,
  final_url text,
  http_status integer,
  content_type text,
  content_hash text,
  title text,
  extracted_text text,
  text_preview text,
  word_count integer,
  byte_size integer,
  captured_at timestamptz not null default now(),
  capture_status text not null check (capture_status in ('succeeded', 'failed')),
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_source_snapshots_source_id
  on source_snapshots (source_id);
create index if not exists idx_source_snapshots_capture_status
  on source_snapshots (capture_status);
create index if not exists idx_source_snapshots_captured_at
  on source_snapshots (captured_at desc);
create index if not exists idx_source_snapshots_source_captured_at
  on source_snapshots (source_id, captured_at desc, created_at desc);

-- Keyword Matches Table (Sprint 4)
create table if not exists keyword_matches (
  id uuid primary key default gen_random_uuid(),
  source_snapshot_id uuid not null references source_snapshots(id) on delete restrict,
  source_id uuid not null references sources(id) on delete restrict,
  platform_id uuid not null references platforms(id) on delete restrict,
  category text not null,
  keyword text not null,
  matched_text text not null,
  excerpt text not null,
  context_before text,
  context_after text,
  start_offset integer,
  end_offset integer,
  confidence integer default 1,
  noise_score integer default 0,
  status text not null default 'pending' check (status in ('pending','grouped','ignored','promoted')),
  candidate_id uuid references red_flag_candidates(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_keyword_matches_source_snapshot_id on keyword_matches(source_snapshot_id);
create index if not exists idx_keyword_matches_source_id on keyword_matches(source_id);
create index if not exists idx_keyword_matches_platform_id on keyword_matches(platform_id);
create index if not exists idx_keyword_matches_category on keyword_matches(category);
create index if not exists idx_keyword_matches_status on keyword_matches(status);
create index if not exists idx_keyword_matches_keyword on keyword_matches(keyword);
create index if not exists idx_keyword_matches_candidate_id on keyword_matches(candidate_id);

-- Add traceability columns to red_flag_candidates (nullable, safe migration)
alter table if exists red_flag_candidates add column if not exists source_snapshot_id uuid references source_snapshots(id) on delete set null;
alter table if exists red_flag_candidates add column if not exists primary_keyword_match_id uuid references keyword_matches(id) on delete set null;

-- Trigger for updated_at on keyword_matches
drop trigger if exists trg_polibrawl_keyword_matches_updated_at on keyword_matches;
create trigger trg_polibrawl_keyword_matches_updated_at
before update on keyword_matches
for each row execute function set_polibrawl_updated_at();

create table if not exists red_flag_candidates (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid not null references platforms(id) on delete restrict,
  source_id uuid not null references sources(id) on delete restrict,
  category text not null check (category in ('money', 'account', 'kyc', 'payout', 'appeal', 'data_saas', 'api', 'legal')),
  headline text not null,
  excerpt text not null,
  matched_keywords text[] not null default '{}'::text[],
  confidence_note text,
  reviewer_notes text,
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'approved', 'rejected', 'merged')),
  reviewed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  review_status text,
  review_notes text,
  reviewed_by uuid,
  merged_into_candidate_id uuid references red_flag_candidates(id) on delete set null,
  approved_red_flag_id uuid, -- will reference red_flags(id) later
  reject_reason text
);

create index if not exists idx_red_flag_candidates_platform_id on red_flag_candidates (platform_id);
create index if not exists idx_red_flag_candidates_source_id on red_flag_candidates (source_id);
create index if not exists idx_red_flag_candidates_status on red_flag_candidates (status);
create index if not exists idx_red_flag_candidates_category on red_flag_candidates (category);

alter table if exists red_flag_candidates drop constraint if exists red_flag_candidates_status_check;
alter table if exists red_flag_candidates add constraint red_flag_candidates_status_check check (status in ('pending', 'reviewing', 'approved', 'rejected', 'merged'));

alter table if exists red_flag_candidates add column if not exists review_status text;
alter table if exists red_flag_candidates add column if not exists review_notes text;
alter table if exists red_flag_candidates add column if not exists reviewed_by uuid;
alter table if exists red_flag_candidates add column if not exists merged_into_candidate_id uuid references red_flag_candidates(id) on delete set null;
alter table if exists red_flag_candidates add column if not exists approved_red_flag_id uuid;
alter table if exists red_flag_candidates add column if not exists reject_reason text;

drop trigger if exists trg_polibrawl_red_flag_candidates_updated_at on red_flag_candidates;
create trigger trg_polibrawl_red_flag_candidates_updated_at
before update on red_flag_candidates
for each row execute function set_polibrawl_updated_at();

create table if not exists candidate_review_history (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references red_flag_candidates(id) on delete cascade,
  action text not null,
  old_status text,
  new_status text,
  reviewer uuid,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_candidate_review_history_candidate_id on candidate_review_history (candidate_id);

create table if not exists red_flags (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid not null references platforms(id) on delete restrict,
  slug text not null,
  title text not null,
  category text not null check (category in ('money', 'account', 'kyc', 'payout', 'appeal', 'data_saas', 'api', 'legal')),
  level text not null check (level in ('low', 'medium', 'high', 'critical', 'unknown')),
  summary text not null,
  why_it_matters text not null,
  status text not null default 'draft' check (status in ('draft', 'ready_for_review', 'published', 'archived')),
  reviewed_at timestamptz,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  excerpt text,
  source_id uuid references sources(id) on delete restrict,
  source_snapshot_id uuid references source_snapshots(id) on delete restrict,
  keywords text[] not null default '{}'::text[],
  primary_evidence_reference text,
  constraint red_flags_published_status_check
    check (published_at is null or status = 'published')
);

alter table if exists red_flags add column if not exists excerpt text;
alter table if exists red_flags add column if not exists source_id uuid references sources(id) on delete restrict;
alter table if exists red_flags add column if not exists source_snapshot_id uuid references source_snapshots(id) on delete restrict;
alter table if exists red_flags add column if not exists keywords text[] not null default '{}'::text[];
alter table if exists red_flags add column if not exists primary_evidence_reference text;

alter table if exists red_flag_candidates
  add constraint fk_red_flag_candidates_approved_red_flag_id
  foreign key (approved_red_flag_id) references red_flags(id) on delete set null;

create unique index if not exists idx_red_flags_platform_slug_unique on red_flags (platform_id, slug);
create index if not exists idx_red_flags_platform_id on red_flags (platform_id);
create index if not exists idx_red_flags_status on red_flags (status);
create index if not exists idx_red_flags_category on red_flags (category);
create index if not exists idx_red_flags_reviewed_at on red_flags (reviewed_at desc nulls last);

drop trigger if exists trg_polibrawl_red_flags_updated_at on red_flags;
create trigger trg_polibrawl_red_flags_updated_at
before update on red_flags
for each row execute function set_polibrawl_updated_at();

create table if not exists evidence (
  id uuid primary key default gen_random_uuid(),
  red_flag_id uuid not null references red_flags(id) on delete restrict,
  source_id uuid not null references sources(id) on delete restrict,
  excerpt text not null,
  source_title text not null,
  source_url text,
  notes text,
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'approved', 'archived')),
  reviewed_at timestamptz,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint evidence_published_requires_approved_check
    check (published_at is null or status = 'approved')
);

create index if not exists idx_evidence_red_flag_id on evidence (red_flag_id);
create index if not exists idx_evidence_source_id on evidence (source_id);
create index if not exists idx_evidence_status on evidence (status);
create index if not exists idx_evidence_sort_order on evidence (red_flag_id, sort_order);

drop trigger if exists trg_polibrawl_evidence_updated_at on evidence;
create trigger trg_polibrawl_evidence_updated_at
before update on evidence
for each row execute function set_polibrawl_updated_at();

create table if not exists survival_notes (
  id uuid primary key default gen_random_uuid(),
  red_flag_id uuid not null references red_flags(id) on delete restrict,
  note_title text not null,
  note_body text not null,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint survival_notes_published_status_check
    check (published_at is null or status = 'published')
);

create index if not exists idx_survival_notes_red_flag_id on survival_notes (red_flag_id);
create index if not exists idx_survival_notes_status on survival_notes (status);
create index if not exists idx_survival_notes_priority on survival_notes (priority);

drop trigger if exists trg_polibrawl_survival_notes_updated_at on survival_notes;
create trigger trg_polibrawl_survival_notes_updated_at
before update on survival_notes
for each row execute function set_polibrawl_updated_at();

create table if not exists backup_options (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid not null references platforms(id) on delete restrict,
  label text not null,
  option_type text not null check (option_type in ('alternative_platform', 'operational_backup', 'payout_backup', 'data_export', 'appeal_path', 'other')),
  summary text not null,
  tradeoffs text not null,
  link_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint backup_options_published_status_check
    check (published_at is null or status = 'published')
);

create index if not exists idx_backup_options_platform_id on backup_options (platform_id);
create index if not exists idx_backup_options_status on backup_options (status);
create index if not exists idx_backup_options_option_type on backup_options (option_type);

drop trigger if exists trg_polibrawl_backup_options_updated_at on backup_options;
create trigger trg_polibrawl_backup_options_updated_at
before update on backup_options
for each row execute function set_polibrawl_updated_at();

create table if not exists checklists (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid not null references platforms(id) on delete restrict,
  title text not null,
  intro text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint checklists_published_status_check
    check (published_at is null or status = 'published')
);

create index if not exists idx_checklists_platform_id on checklists (platform_id);
create index if not exists idx_checklists_status on checklists (status);

drop trigger if exists trg_polibrawl_checklists_updated_at on checklists;
create trigger trg_polibrawl_checklists_updated_at
before update on checklists
for each row execute function set_polibrawl_updated_at();

create table if not exists checklist_items (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references checklists(id) on delete restrict,
  label text not null,
  details text,
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint checklist_items_published_status_check
    check (published_at is null or status = 'published')
);

create unique index if not exists idx_checklist_items_order_unique on checklist_items (checklist_id, sort_order);
create index if not exists idx_checklist_items_status on checklist_items (status);

drop trigger if exists trg_polibrawl_checklist_items_updated_at on checklist_items;
create trigger trg_polibrawl_checklist_items_updated_at
before update on checklist_items
for each row execute function set_polibrawl_updated_at();

create table if not exists review_requests (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid references platforms(id) on delete restrict,
  platform_name text,
  email text,
  message text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'use_as_private_signal', 'published_summary', 'rejected')),
  reviewed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint review_requests_platform_reference_check
    check (platform_id is not null or platform_name is not null)
);

create index if not exists idx_review_requests_platform_id on review_requests (platform_id);
create index if not exists idx_review_requests_status on review_requests (status);
create index if not exists idx_review_requests_created_at on review_requests (created_at desc);

drop trigger if exists trg_polibrawl_review_requests_updated_at on review_requests;
create trigger trg_polibrawl_review_requests_updated_at
before update on review_requests
for each row execute function set_polibrawl_updated_at();

create table if not exists platform_watchers (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid not null references platforms(id) on delete restrict,
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'active', 'unsubscribed', 'bounced')),
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_platform_watchers_platform_email_unique
  on platform_watchers (platform_id, lower(email));
create index if not exists idx_platform_watchers_status on platform_watchers (status);

drop trigger if exists trg_polibrawl_platform_watchers_updated_at on platform_watchers;
create trigger trg_polibrawl_platform_watchers_updated_at
before update on platform_watchers
for each row execute function set_polibrawl_updated_at();

create table if not exists experience_submissions (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid not null references platforms(id) on delete restrict,
  category text not null check (category in ('money', 'account', 'kyc', 'payout', 'appeal', 'data_saas', 'api', 'legal', 'other')),
  summary text not null,
  country text,
  amount_range text,
  evidence_note text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'use_as_private_signal', 'published_summary', 'rejected')),
  reviewed_at timestamptz,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint experience_submissions_published_status_check
    check (published_at is null or status = 'published_summary')
);

create index if not exists idx_experience_submissions_platform_id on experience_submissions (platform_id);
create index if not exists idx_experience_submissions_status on experience_submissions (status);
create index if not exists idx_experience_submissions_category on experience_submissions (category);

drop trigger if exists trg_polibrawl_experience_submissions_updated_at on experience_submissions;
create trigger trg_polibrawl_experience_submissions_updated_at
before update on experience_submissions
for each row execute function set_polibrawl_updated_at();

create table if not exists survival_tip_submissions (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid not null references platforms(id) on delete restrict,
  tip_summary text not null,
  details text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'use_as_private_signal', 'published_summary', 'rejected')),
  reviewed_at timestamptz,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint survival_tip_submissions_published_status_check
    check (published_at is null or status = 'published_summary')
);

create index if not exists idx_survival_tip_submissions_platform_id on survival_tip_submissions (platform_id);
create index if not exists idx_survival_tip_submissions_status on survival_tip_submissions (status);

drop trigger if exists trg_polibrawl_survival_tip_submissions_updated_at on survival_tip_submissions;
create trigger trg_polibrawl_survival_tip_submissions_updated_at
before update on survival_tip_submissions
for each row execute function set_polibrawl_updated_at();

create table if not exists corrections (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid references platforms(id) on delete restrict,
  issue_type text not null check (issue_type in ('outdated_policy', 'wrong_source', 'incorrect_interpretation', 'missing_evidence', 'broken_link', 'legal_editorial_concern', 'other')),
  message text not null,
  source_url text,
  contact_email text,
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'resolved', 'rejected')),
  reviewed_at timestamptz,
  resolved_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_corrections_platform_id on corrections (platform_id);
create index if not exists idx_corrections_status on corrections (status);
create index if not exists idx_corrections_created_at on corrections (created_at desc);

drop trigger if exists trg_polibrawl_corrections_updated_at on corrections;
create trigger trg_polibrawl_corrections_updated_at
before update on corrections
for each row execute function set_polibrawl_updated_at();
