create table if not exists source_acquisition_attempts (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references sources(id) on delete restrict,
  attempted_url text,
  method text not null,
  status text not null,
  http_status integer,
  final_url text,
  error_code text,
  error_message text,
  duration_ms integer,
  created_at timestamptz not null default now()
);

alter table if exists sources add column if not exists preferred_acquisition_method text;
alter table if exists sources add column if not exists last_acquisition_status text;
alter table if exists sources add column if not exists last_acquisition_error text;
alter table if exists sources add column if not exists acquisition_notes text;

-- Add new constraints or relax old constraints
-- We previously had check (capture_method in ('fetch', 'paste')) in source_snapshots.
-- We drop it and let it be open or update it.
alter table if exists source_snapshots drop constraint if exists source_snapshots_capture_method_check;

alter table if exists source_snapshots add column if not exists acquisition_method text;
alter table if exists source_snapshots add column if not exists raw_content_type text;
alter table if exists source_snapshots add column if not exists raw_byte_size integer;
alter table if exists source_snapshots add column if not exists extraction_method text;
alter table if exists source_snapshots add column if not exists extraction_warnings text[];
