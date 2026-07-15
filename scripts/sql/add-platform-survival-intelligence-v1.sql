create table if not exists resolution_routes (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid not null references platforms(id) on delete restrict,
  organization_name text not null,
  organization_type text not null,
  country text,
  jurisdiction text,
  official_url text not null,
  eligible_users text[] not null default '{}'::text[],
  eligible_disputes text[] not null default '{}'::text[],
  requirements text[] not null default '{}'::text[],
  steps text[] not null default '{}'::text[],
  fees text,
  limits text,
  deadline text,
  verification_source text not null,
  last_verified_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  display_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resolution_routes_published_status_check
    check (published_at is null or status = 'published')
);

create index if not exists idx_resolution_routes_platform_id on resolution_routes (platform_id);
create index if not exists idx_resolution_routes_status on resolution_routes (status);
create index if not exists idx_resolution_routes_display_order on resolution_routes (platform_id, display_order, updated_at desc);

drop trigger if exists trg_polibrawl_resolution_routes_updated_at on resolution_routes;
create trigger trg_polibrawl_resolution_routes_updated_at
before update on resolution_routes
for each row execute function set_polibrawl_updated_at();

create table if not exists dependency_scores (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid not null references platforms(id) on delete restrict,
  score integer not null check (score >= 0 and score <= 100),
  risk_level text not null check (risk_level in ('low', 'medium', 'high', 'critical', 'unknown')),
  factors text[] not null default '{}'::text[],
  explanation text not null,
  generated_at timestamptz not null default now(),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dependency_scores_published_status_check
    check (published_at is null or status = 'published')
);

create index if not exists idx_dependency_scores_platform_id on dependency_scores (platform_id);
create index if not exists idx_dependency_scores_status on dependency_scores (status);
create index if not exists idx_dependency_scores_generated_at on dependency_scores (platform_id, generated_at desc, updated_at desc);

drop trigger if exists trg_polibrawl_dependency_scores_updated_at on dependency_scores;
create trigger trg_polibrawl_dependency_scores_updated_at
before update on dependency_scores
for each row execute function set_polibrawl_updated_at();

create table if not exists risk_timelines (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid not null references platforms(id) on delete restrict,
  title text not null,
  events jsonb not null default '[]'::jsonb,
  source text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  display_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint risk_timelines_events_array_check check (jsonb_typeof(events) = 'array'),
  constraint risk_timelines_published_status_check
    check (published_at is null or status = 'published')
);

create index if not exists idx_risk_timelines_platform_id on risk_timelines (platform_id);
create index if not exists idx_risk_timelines_status on risk_timelines (status);
create index if not exists idx_risk_timelines_display_order on risk_timelines (platform_id, display_order, updated_at desc);

drop trigger if exists trg_polibrawl_risk_timelines_updated_at on risk_timelines;
create trigger trg_polibrawl_risk_timelines_updated_at
before update on risk_timelines
for each row execute function set_polibrawl_updated_at();

create table if not exists evidence_confidence (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid not null references platforms(id) on delete restrict,
  score integer not null check (score >= 0 and score <= 100),
  factors text[] not null default '{}'::text[],
  last_verified_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint evidence_confidence_published_status_check
    check (published_at is null or status = 'published')
);

create index if not exists idx_evidence_confidence_platform_id on evidence_confidence (platform_id);
create index if not exists idx_evidence_confidence_status on evidence_confidence (status);
create index if not exists idx_evidence_confidence_verified_at on evidence_confidence (platform_id, last_verified_at desc nulls last, updated_at desc);

drop trigger if exists trg_polibrawl_evidence_confidence_updated_at on evidence_confidence;
create trigger trg_polibrawl_evidence_confidence_updated_at
before update on evidence_confidence
for each row execute function set_polibrawl_updated_at();
