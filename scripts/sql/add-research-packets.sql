-- Sprint 8 / Research Packet Builder
-- Additive only — no destructive changes.

create table if not exists research_packets (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references red_flag_candidates(id) on delete restrict,
  platform_id uuid not null references platforms(id) on delete restrict,
  source_snapshot_id uuid references source_snapshots(id) on delete set null,
  category text not null,
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'ready', 'archived')),
  confidence_score integer not null default 0,
  noise_score integer not null default 0,
  summary text,
  suggested_level text,
  suggested_risk text,
  scanner_observations text,
  possible_false_positives text,
  keywords_found text[] not null default '{}'::text[],
  source_url text,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists research_packets_candidate_id_unique
  on research_packets (candidate_id);

create index if not exists research_packets_platform_id_idx
  on research_packets (platform_id);

create index if not exists research_packets_status_idx
  on research_packets (status);

create index if not exists research_packets_category_idx
  on research_packets (category);

create index if not exists research_packets_confidence_score_idx
  on research_packets (confidence_score desc);

drop trigger if exists trg_polibrawl_research_packets_updated_at on research_packets;
create trigger trg_polibrawl_research_packets_updated_at
before update on research_packets
for each row execute function set_polibrawl_updated_at();

create table if not exists research_packet_evidence (
  id uuid primary key default gen_random_uuid(),
  research_packet_id uuid not null references research_packets(id) on delete restrict,
  keyword_match_id uuid references keyword_matches(id) on delete set null,
  excerpt text not null,
  context_before text,
  context_after text,
  source_url text,
  section_hint text,
  confidence_score integer not null default 0,
  noise_score integer not null default 0,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists research_packet_evidence_packet_id_idx
  on research_packet_evidence (research_packet_id);

create index if not exists research_packet_evidence_display_order_idx
  on research_packet_evidence (research_packet_id, display_order);

create index if not exists research_packet_evidence_keyword_match_id_idx
  on research_packet_evidence (keyword_match_id);
