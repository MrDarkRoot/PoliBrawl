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
  source_type text not null check (source_type in ('policy', 'help_center', 'payout_policy', 'account_policy', 'api_policy', 'appeals_policy', 'other')),
  priority text not null default 'supporting' check (priority in ('core', 'supporting', 'ignore')),
  title text not null,
  url text,
  body_text text,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived', 'failed_capture')),
  notes text,
  captured_at timestamptz,
  reviewed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_sources_platform_url_unique
  on sources (platform_id, lower(url))
  where url is not null;
create index if not exists idx_sources_platform_id on sources (platform_id);
create index if not exists idx_sources_status on sources (status);
create index if not exists idx_sources_priority on sources (priority);
create index if not exists idx_sources_reviewed_at on sources (reviewed_at desc nulls last);

drop trigger if exists trg_polibrawl_sources_updated_at on sources;
create trigger trg_polibrawl_sources_updated_at
before update on sources
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
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected_noise', 'duplicate', 'needs_more_review')),
  reviewed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_red_flag_candidates_platform_id on red_flag_candidates (platform_id);
create index if not exists idx_red_flag_candidates_source_id on red_flag_candidates (source_id);
create index if not exists idx_red_flag_candidates_status on red_flag_candidates (status);
create index if not exists idx_red_flag_candidates_category on red_flag_candidates (category);

drop trigger if exists trg_polibrawl_red_flag_candidates_updated_at on red_flag_candidates;
create trigger trg_polibrawl_red_flag_candidates_updated_at
before update on red_flag_candidates
for each row execute function set_polibrawl_updated_at();

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
  constraint red_flags_published_status_check
    check (published_at is null or status = 'published')
);

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
