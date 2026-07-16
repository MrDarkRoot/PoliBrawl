create table if not exists policy_changes (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid not null references platforms(id) on delete restrict,
  source_id uuid references sources(id) on delete restrict,
  old_snapshot_id uuid references source_snapshots(id) on delete restrict,
  new_snapshot_id uuid references source_snapshots(id) on delete restrict,
  change_type text not null default 'document_change',
  summary text,
  impact_level text not null default 'unknown' check (impact_level in ('low', 'medium', 'high', 'critical', 'unknown')),
  published_status text not null default 'draft' check (published_status in ('draft', 'reviewed', 'published', 'archived')),
  what_changed text,
  who_is_affected text[] not null default '{}'::text[],
  why_it_matters text,
  what_to_do text[] not null default '{}'::text[],
  reviewed_at timestamptz,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  policy_source_id uuid,
  old_version_id uuid,
  new_version_id uuid,
  old_hash text,
  new_hash text,
  detected_at timestamptz not null default now(),
  status text not null default 'needs_review',
  importance text,
  reviewed_by uuid,
  check (published_at is null or published_status = 'published')
);

alter table if exists policy_changes add column if not exists source_id uuid references sources(id) on delete restrict;
alter table if exists policy_changes add column if not exists old_snapshot_id uuid references source_snapshots(id) on delete restrict;
alter table if exists policy_changes add column if not exists new_snapshot_id uuid references source_snapshots(id) on delete restrict;
alter table if exists policy_changes add column if not exists change_type text not null default 'document_change';
alter table if exists policy_changes add column if not exists summary text;
alter table if exists policy_changes add column if not exists impact_level text not null default 'unknown';
alter table if exists policy_changes add column if not exists published_status text not null default 'draft';
alter table if exists policy_changes add column if not exists what_changed text;
alter table if exists policy_changes add column if not exists who_is_affected text[] not null default '{}'::text[];
alter table if exists policy_changes add column if not exists why_it_matters text;
alter table if exists policy_changes add column if not exists what_to_do text[] not null default '{}'::text[];
alter table if exists policy_changes add column if not exists published_at timestamptz;
alter table if exists policy_changes add column if not exists archived_at timestamptz;
alter table if exists policy_changes add column if not exists updated_at timestamptz not null default now();
alter table if exists policy_changes add column if not exists policy_source_id uuid;
alter table if exists policy_changes add column if not exists old_version_id uuid;
alter table if exists policy_changes add column if not exists new_version_id uuid;
alter table if exists policy_changes add column if not exists old_hash text;
alter table if exists policy_changes add column if not exists new_hash text;
alter table if exists policy_changes add column if not exists detected_at timestamptz not null default now();
alter table if exists policy_changes add column if not exists status text not null default 'needs_review';
alter table if exists policy_changes add column if not exists importance text;
alter table if exists policy_changes add column if not exists reviewed_by uuid;

alter table if exists policy_changes drop constraint if exists policy_changes_impact_level_check;
alter table if exists policy_changes
  add constraint policy_changes_impact_level_check
  check (impact_level in ('low', 'medium', 'high', 'critical', 'unknown'));

alter table if exists policy_changes drop constraint if exists policy_changes_published_status_enum_check;
alter table if exists policy_changes
  add constraint policy_changes_published_status_enum_check
  check (published_status in ('draft', 'reviewed', 'published', 'archived'));

create index if not exists idx_policy_changes_platform_id on policy_changes (platform_id);
create index if not exists idx_policy_changes_source_id on policy_changes (source_id);
create index if not exists idx_policy_changes_published_status on policy_changes (published_status);
create index if not exists idx_policy_changes_reviewed_at on policy_changes (reviewed_at desc nulls last);
create index if not exists idx_policy_changes_created_at on policy_changes (created_at desc);
create index if not exists idx_policy_changes_public_feed on policy_changes (published_at desc nulls last, created_at desc)
  where published_status = 'published' and archived_at is null;

drop trigger if exists trg_polibrawl_policy_changes_updated_at on policy_changes;
create trigger trg_polibrawl_policy_changes_updated_at
before update on policy_changes
for each row execute function set_polibrawl_updated_at();

create table if not exists user_platform_watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  platform_id uuid not null references platforms(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_user_platform_watchlist_user_platform_unique
  on user_platform_watchlist (user_id, platform_id);
create index if not exists idx_user_platform_watchlist_user_id
  on user_platform_watchlist (user_id, created_at desc);
create index if not exists idx_user_platform_watchlist_platform_id
  on user_platform_watchlist (platform_id, created_at desc);

drop trigger if exists trg_polibrawl_user_platform_watchlist_updated_at on user_platform_watchlist;
create trigger trg_polibrawl_user_platform_watchlist_updated_at
before update on user_platform_watchlist
for each row execute function set_polibrawl_updated_at();

create table if not exists policy_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  policy_change_id uuid not null references policy_changes(id) on delete restrict,
  status text not null default 'unread' check (status in ('unread', 'read')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  read_at timestamptz
);

create unique index if not exists idx_policy_alerts_user_change_unique
  on policy_alerts (user_id, policy_change_id);
create index if not exists idx_policy_alerts_user_status_created_at
  on policy_alerts (user_id, status, created_at desc);
create index if not exists idx_policy_alerts_policy_change_id
  on policy_alerts (policy_change_id);

drop trigger if exists trg_polibrawl_policy_alerts_updated_at on policy_alerts;
create trigger trg_polibrawl_policy_alerts_updated_at
before update on policy_alerts
for each row execute function set_polibrawl_updated_at();
