-- ============================================================
-- Policy Intelligence Editorial Platform — MVP Schema
-- Target: PostgreSQL / Supabase
-- Version: 0.1
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- Utility: updated_at trigger
-- ============================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- Admin / User Profiles
-- If using Supabase Auth, profiles.id should match auth.users.id
-- ============================================================

create table if not exists profiles (
  id uuid primary key,
  email text,
  username text,
  role text not null default 'viewer'
    check (role in ('viewer', 'editor', 'admin', 'owner')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at
before update on profiles
for each row execute function set_updated_at();

-- ============================================================
-- Platforms
-- ============================================================

create table if not exists platforms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  website_url text not null,
  category text not null
    check (category in ('payment', 'creator_freelance', 'saas_vendor')),
  country text,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'archived', 'needs_review')),
  summary text,
  internal_notes text,
  last_reviewed_at timestamptz,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_platforms_category on platforms(category);
create index if not exists idx_platforms_status on platforms(status);
create index if not exists idx_platforms_last_reviewed_at on platforms(last_reviewed_at);

drop trigger if exists trg_platforms_updated_at on platforms;
create trigger trg_platforms_updated_at
before update on platforms
for each row execute function set_updated_at();

-- ============================================================
-- Discovery Runs
-- ============================================================

create table if not exists discovery_runs (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid not null references platforms(id) on delete cascade,
  website_url text not null,
  status text not null default 'running'
    check (status in ('running', 'completed', 'failed', 'partial')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_discovery_runs_platform_id on discovery_runs(platform_id);
create index if not exists idx_discovery_runs_status on discovery_runs(status);

-- ============================================================
-- Source Candidates
-- URLs discovered by crawler/discovery agent.
-- These are NOT approved policy sources yet.
-- ============================================================

create table if not exists source_candidates (
  id uuid primary key default gen_random_uuid(),
  discovery_run_id uuid references discovery_runs(id) on delete cascade,
  platform_id uuid not null references platforms(id) on delete cascade,
  url text not null,
  title text,
  suggested_document_type text,
  suggested_tier text,
  confidence numeric(5,4),
  detection_reason text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'needs_manual_review')),
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_source_candidates_platform_id on source_candidates(platform_id);
create index if not exists idx_source_candidates_status on source_candidates(status);
create index if not exists idx_source_candidates_discovery_run_id on source_candidates(discovery_run_id);

-- ============================================================
-- Policy Sources
-- Approved policy/legal/document URLs.
-- This is the source registry.
-- ============================================================

create table if not exists policy_sources (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid not null references platforms(id) on delete cascade,

  title text,
  url text not null,
  final_url text,

  document_type text not null
    check (
      document_type in (
        'terms_of_service',
        'user_agreement',
        'privacy_policy',
        'acceptable_use_policy',
        'payment_terms',
        'payout_policy',
        'refund_policy',
        'fees_page',
        'developer_terms',
        'api_terms',
        'data_processing_addendum',
        'security_policy',
        'service_terms',
        'billing_terms',
        'help_center_article',
        'faq_article',
        'complaints_policy',
        'dispute_policy',
        'seller_protection_policy',
        'buyer_protection_policy',
        'chargeback_policy',
        'policy_updates',
        'legal_hub',
        'status_policy',
        'corporate_position',
        'transparency_report',
        'trust_center_page',
        'public_policy_statement',
        'blog_context',
        'press_release_context',
        'marketing_page',
        'generic_blog_post',
        'newsroom_article',
        'career_page',
        'investor_page',
        'campaign_page',
        'landing_page',
        'other'
      )
    ),

  source_tier text not null
    check (
      source_tier in (
        'tier_1_core',
        'tier_2_supporting',
        'tier_3_context',
        'tier_4_ignore'
      )
    ),

  use_for_scoring boolean not null default false,
  monitor_enabled boolean not null default false,

  status text not null default 'active'
    check (
      status in (
        'active',
        'unreachable',
        'redirected',
        'changed',
        'deprecated',
        'needs_review',
        'ignored'
      )
    ),

  current_hash text,
  last_fetched_at timestamptz,
  last_reviewed_at timestamptz,

  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(platform_id, url)
);

create index if not exists idx_policy_sources_platform_id on policy_sources(platform_id);
create index if not exists idx_policy_sources_document_type on policy_sources(document_type);
create index if not exists idx_policy_sources_source_tier on policy_sources(source_tier);
create index if not exists idx_policy_sources_monitor_enabled on policy_sources(monitor_enabled);
create index if not exists idx_policy_sources_status on policy_sources(status);

drop trigger if exists trg_policy_sources_updated_at on policy_sources;
create trigger trg_policy_sources_updated_at
before update on policy_sources
for each row execute function set_updated_at();

-- ============================================================
-- Fetch Logs
-- Stores metadata for fetch attempts.
-- ============================================================

create table if not exists fetch_logs (
  id uuid primary key default gen_random_uuid(),
  policy_source_id uuid not null references policy_sources(id) on delete cascade,
  requested_url text not null,
  final_url text,
  http_status integer,
  content_type text,
  response_size integer,
  success boolean not null default false,
  error_message text,
  fetched_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_fetch_logs_policy_source_id on fetch_logs(policy_source_id);
create index if not exists idx_fetch_logs_fetched_at on fetch_logs(fetched_at);
create index if not exists idx_fetch_logs_success on fetch_logs(success);

-- ============================================================
-- Document Versions
-- Snapshot of extracted document text.
-- ============================================================

create table if not exists document_versions (
  id uuid primary key default gen_random_uuid(),
  policy_source_id uuid not null references policy_sources(id) on delete cascade,

  version_number integer not null,
  text_hash text not null,

  raw_html_storage_key text,
  pdf_storage_key text,

  markdown_text text,
  plain_text text,

  extraction_confidence numeric(5,4),
  extraction_method text,
  fetched_at timestamptz not null default now(),
  effective_date date,

  review_status text not null default 'unreviewed'
    check (
      review_status in (
        'unreviewed',
        'reviewed',
        'published',
        'superseded',
        'ignored',
        'needs_manual_extraction'
      )
    ),

  created_at timestamptz not null default now(),

  unique(policy_source_id, text_hash),
  unique(policy_source_id, version_number)
);

create index if not exists idx_document_versions_policy_source_id on document_versions(policy_source_id);
create index if not exists idx_document_versions_text_hash on document_versions(text_hash);
create index if not exists idx_document_versions_review_status on document_versions(review_status);
create index if not exists idx_document_versions_fetched_at on document_versions(fetched_at);

-- ============================================================
-- Policy Changes
-- Created when a monitored source changes hash.
-- ============================================================

create table if not exists policy_changes (
  id uuid primary key default gen_random_uuid(),

  platform_id uuid not null references platforms(id) on delete cascade,
  policy_source_id uuid not null references policy_sources(id) on delete cascade,

  old_version_id uuid references document_versions(id) on delete set null,
  new_version_id uuid references document_versions(id) on delete set null,

  old_hash text,
  new_hash text,

  detected_at timestamptz not null default now(),

  status text not null default 'needs_review'
    check (status in ('needs_review', 'reviewed', 'ignored', 'published')),

  importance text not null default 'unknown'
    check (importance in ('minor', 'important', 'critical', 'unknown')),

  summary text,
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz
);

create index if not exists idx_policy_changes_platform_id on policy_changes(platform_id);
create index if not exists idx_policy_changes_policy_source_id on policy_changes(policy_source_id);
create index if not exists idx_policy_changes_status on policy_changes(status);
create index if not exists idx_policy_changes_detected_at on policy_changes(detected_at);

-- ============================================================
-- Sections
-- ============================================================

create table if not exists sections (
  id uuid primary key default gen_random_uuid(),

  document_version_id uuid not null references document_versions(id) on delete cascade,
  parent_section_id uuid references sections(id) on delete cascade,

  heading text,
  section_order integer not null default 0,
  section_text text,
  anchor text,

  created_at timestamptz not null default now()
);

create index if not exists idx_sections_document_version_id on sections(document_version_id);
create index if not exists idx_sections_parent_section_id on sections(parent_section_id);

-- ============================================================
-- Clauses
-- ============================================================

create table if not exists clauses (
  id uuid primary key default gen_random_uuid(),

  section_id uuid references sections(id) on delete cascade,
  document_version_id uuid not null references document_versions(id) on delete cascade,

  clause_order integer not null default 0,
  clause_text text not null,
  clause_hash text,
  word_count integer,

  created_at timestamptz not null default now()
);

create index if not exists idx_clauses_section_id on clauses(section_id);
create index if not exists idx_clauses_document_version_id on clauses(document_version_id);
create index if not exists idx_clauses_clause_hash on clauses(clause_hash);

-- Optional full-text search index
create index if not exists idx_clauses_text_search
on clauses using gin(to_tsvector('english', clause_text));

-- ============================================================
-- Signal Rules
-- Used by Signal Candidate Engine.
-- ============================================================

create table if not exists signal_rules (
  id uuid primary key default gen_random_uuid(),

  rule_name text not null,
  category text not null
    check (
      category in (
        'money_control',
        'payout_control',
        'account_control',
        'kyc_verification',
        'appeal_clarity',
        'data_control',
        'billing_control',
        'business_continuity',
        'transparency',
        'api_developer_dependency',
        'content_monetization_control'
      )
    ),

  signal_name text not null,

  keywords jsonb not null default '[]'::jsonb,
  regex_patterns jsonb not null default '[]'::jsonb,

  suggested_level text not null default 'unknown'
    check (suggested_level in ('low', 'medium', 'high', 'very_high', 'unknown')),

  confidence_weight numeric(5,4) not null default 0.5000,
  false_positive_notes text,

  enabled boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_signal_rules_category on signal_rules(category);
create index if not exists idx_signal_rules_enabled on signal_rules(enabled);

drop trigger if exists trg_signal_rules_updated_at on signal_rules;
create trigger trg_signal_rules_updated_at
before update on signal_rules
for each row execute function set_updated_at();

-- ============================================================
-- Signal Candidates
-- Generated by rules/AI/manual detection.
-- Not public until approved.
-- ============================================================

create table if not exists signal_candidates (
  id uuid primary key default gen_random_uuid(),

  clause_id uuid not null references clauses(id) on delete cascade,
  platform_id uuid not null references platforms(id) on delete cascade,
  policy_source_id uuid not null references policy_sources(id) on delete cascade,

  rule_id uuid references signal_rules(id) on delete set null,

  suggested_signal text not null,
  suggested_category text not null,
  suggested_level text not null default 'unknown'
    check (suggested_level in ('low', 'medium', 'high', 'very_high', 'unknown')),

  confidence numeric(5,4),
  matched_terms jsonb not null default '[]'::jsonb,

  detection_method text not null default 'rule'
    check (detection_method in ('rule', 'ai', 'manual', 'hybrid')),

  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'needs_deeper_review')),

  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,

  created_at timestamptz not null default now()
);

create index if not exists idx_signal_candidates_clause_id on signal_candidates(clause_id);
create index if not exists idx_signal_candidates_platform_id on signal_candidates(platform_id);
create index if not exists idx_signal_candidates_policy_source_id on signal_candidates(policy_source_id);
create index if not exists idx_signal_candidates_status on signal_candidates(status);
create index if not exists idx_signal_candidates_suggested_category on signal_candidates(suggested_category);

-- ============================================================
-- Approved Signals
-- ============================================================

create table if not exists signals (
  id uuid primary key default gen_random_uuid(),

  platform_id uuid not null references platforms(id) on delete cascade,

  category text not null
    check (
      category in (
        'money_control',
        'payout_control',
        'account_control',
        'kyc_verification',
        'appeal_clarity',
        'data_control',
        'billing_control',
        'business_continuity',
        'transparency',
        'api_developer_dependency',
        'content_monetization_control'
      )
    ),

  name text not null,

  level text not null
    check (level in ('low', 'medium', 'high', 'very_high', 'unknown')),

  confidence text not null default 'medium'
    check (confidence in ('low', 'medium', 'high')),

  explanation text,
  internal_reason text,

  status text not null default 'draft'
    check (status in ('draft', 'approved', 'published', 'archived', 'needs_review')),

  approved_by uuid references profiles(id) on delete set null,
  approved_at timestamptz,
  published_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_signals_platform_id on signals(platform_id);
create index if not exists idx_signals_category on signals(category);
create index if not exists idx_signals_level on signals(level);
create index if not exists idx_signals_status on signals(status);

drop trigger if exists trg_signals_updated_at on signals;
create trigger trg_signals_updated_at
before update on signals
for each row execute function set_updated_at();

-- ============================================================
-- Evidence Items
-- Evidence must exist before a signal is publicly meaningful.
-- ============================================================

create table if not exists evidence_items (
  id uuid primary key default gen_random_uuid(),

  signal_id uuid not null references signals(id) on delete cascade,
  clause_id uuid references clauses(id) on delete set null,
  policy_source_id uuid not null references policy_sources(id) on delete cascade,
  document_version_id uuid references document_versions(id) on delete set null,

  clause_excerpt text not null,
  source_url text not null,
  document_title text,

  review_date date not null default current_date,

  explanation text not null,
  why_it_matters text,

  visibility text not null default 'public'
    check (visibility in ('public', 'internal', 'hidden')),

  status text not null default 'draft'
    check (status in ('draft', 'approved', 'published', 'archived')),

  created_by uuid references profiles(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_evidence_items_signal_id on evidence_items(signal_id);
create index if not exists idx_evidence_items_policy_source_id on evidence_items(policy_source_id);
create index if not exists idx_evidence_items_status on evidence_items(status);
create index if not exists idx_evidence_items_visibility on evidence_items(visibility);

drop trigger if exists trg_evidence_items_updated_at on evidence_items;
create trigger trg_evidence_items_updated_at
before update on evidence_items
for each row execute function set_updated_at();

-- ============================================================
-- Platform Profiles
-- Generated/public summary layer.
-- ============================================================

create table if not exists platform_profiles (
  id uuid primary key default gen_random_uuid(),

  platform_id uuid not null unique references platforms(id) on delete cascade,

  public_summary text,
  user_implications text,
  alternatives_summary text,

  profile_status text not null default 'draft'
    check (profile_status in ('draft', 'published', 'unpublished', 'needs_review')),

  last_generated_at timestamptz,
  last_published_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_platform_profiles_status on platform_profiles(profile_status);

drop trigger if exists trg_platform_profiles_updated_at on platform_profiles;
create trigger trg_platform_profiles_updated_at
before update on platform_profiles
for each row execute function set_updated_at();

-- ============================================================
-- Public Changelog
-- ============================================================

create table if not exists public_changelogs (
  id uuid primary key default gen_random_uuid(),

  platform_id uuid not null references platforms(id) on delete cascade,
  title text not null,
  body text,
  published_at timestamptz,
  created_by uuid references profiles(id) on delete set null,

  created_at timestamptz not null default now()
);

create index if not exists idx_public_changelogs_platform_id on public_changelogs(platform_id);
create index if not exists idx_public_changelogs_published_at on public_changelogs(published_at);

-- ============================================================
-- Editorial Tasks
-- Unified internal review queue.
-- ============================================================

create table if not exists editorial_tasks (
  id uuid primary key default gen_random_uuid(),

  task_type text not null
    check (
      task_type in (
        'new_platform',
        'source_candidate_review',
        'document_review',
        'policy_change_review',
        'signal_review',
        'evidence_review',
        'correction_request',
        'publish_review'
      )
    ),

  platform_id uuid references platforms(id) on delete cascade,

  related_entity_type text,
  related_entity_id uuid,

  title text not null,

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'in_review',
        'approved',
        'rejected',
        'needs_clarification',
        'published',
        'completed'
      )
    ),

  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),

  assigned_to uuid references profiles(id) on delete set null,
  created_by uuid references profiles(id) on delete set null,
  reviewed_by uuid references profiles(id) on delete set null,

  due_at timestamptz,
  completed_at timestamptz,

  internal_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_editorial_tasks_task_type on editorial_tasks(task_type);
create index if not exists idx_editorial_tasks_status on editorial_tasks(status);
create index if not exists idx_editorial_tasks_priority on editorial_tasks(priority);
create index if not exists idx_editorial_tasks_platform_id on editorial_tasks(platform_id);
create index if not exists idx_editorial_tasks_assigned_to on editorial_tasks(assigned_to);

drop trigger if exists trg_editorial_tasks_updated_at on editorial_tasks;
create trigger trg_editorial_tasks_updated_at
before update on editorial_tasks
for each row execute function set_updated_at();

-- ============================================================
-- Editorial Decision Logs
-- Audit trail for review decisions.
-- ============================================================

create table if not exists editorial_decision_logs (
  id uuid primary key default gen_random_uuid(),

  platform_id uuid references platforms(id) on delete cascade,

  entity_type text not null,
  entity_id uuid not null,

  action text not null,
  previous_value jsonb,
  new_value jsonb,

  reason text,
  decided_by uuid references profiles(id) on delete set null,
  decided_at timestamptz not null default now()
);

create index if not exists idx_editorial_decision_logs_platform_id on editorial_decision_logs(platform_id);
create index if not exists idx_editorial_decision_logs_entity on editorial_decision_logs(entity_type, entity_id);
create index if not exists idx_editorial_decision_logs_decided_at on editorial_decision_logs(decided_at);

-- ============================================================
-- Correction Requests
-- Public/user/platform correction workflow.
-- ============================================================

create table if not exists correction_requests (
  id uuid primary key default gen_random_uuid(),

  platform_id uuid references platforms(id) on delete set null,

  issue_type text not null
    check (
      issue_type in (
        'outdated_policy',
        'wrong_source',
        'incorrect_interpretation',
        'missing_evidence',
        'broken_link',
        'legal_editorial_concern',
        'other'
      )
    ),

  message text not null,
  source_url text,
  contact_email text,

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'in_review',
        'accepted',
        'rejected',
        'needs_more_info',
        'resolved'
      )
    ),

  admin_response text,
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_correction_requests_platform_id on correction_requests(platform_id);
create index if not exists idx_correction_requests_status on correction_requests(status);
create index if not exists idx_correction_requests_issue_type on correction_requests(issue_type);

drop trigger if exists trg_correction_requests_updated_at on correction_requests;
create trigger trg_correction_requests_updated_at
before update on correction_requests
for each row execute function set_updated_at();

-- ============================================================
-- Suggest Platform Requests
-- ============================================================

create table if not exists suggest_platform_requests (
  id uuid primary key default gen_random_uuid(),

  platform_name text not null,
  website_url text,
  suggested_category text
    check (suggested_category in ('payment', 'creator_freelance', 'saas_vendor') or suggested_category is null),

  reason text,
  optional_policy_url text,
  contact_email text,

  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'duplicate', 'needs_more_info')),

  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,

  created_at timestamptz not null default now()
);

create index if not exists idx_suggest_platform_requests_status on suggest_platform_requests(status);

-- ============================================================
-- Alternative Mappings
-- ============================================================

create table if not exists alternative_mappings (
  id uuid primary key default gen_random_uuid(),

  platform_id uuid not null references platforms(id) on delete cascade,
  alternative_platform_id uuid references platforms(id) on delete set null,

  alternative_name text,
  alternative_url text,

  use_case text,
  best_for text,
  tradeoff text,
  country_availability_note text,
  notes text,

  status text not null default 'draft'
    check (status in ('draft', 'approved', 'published', 'archived')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_alternative_mappings_platform_id on alternative_mappings(platform_id);
create index if not exists idx_alternative_mappings_alternative_platform_id on alternative_mappings(alternative_platform_id);
create index if not exists idx_alternative_mappings_status on alternative_mappings(status);

drop trigger if exists trg_alternative_mappings_updated_at on alternative_mappings;
create trigger trg_alternative_mappings_updated_at
before update on alternative_mappings
for each row execute function set_updated_at();

-- ============================================================
-- Seed: Initial Signal Rules
-- ============================================================

insert into signal_rules (
  rule_name,
  category,
  signal_name,
  keywords,
  regex_patterns,
  suggested_level,
  confidence_weight,
  false_positive_notes
)
values
(
  'Fund Hold Authority',
  'money_control',
  'Fund Hold Authority',
  '["hold funds", "payment hold", "withhold funds", "reserve", "rolling reserve", "freeze funds"]'::jsonb,
  '[]'::jsonb,
  'high',
  0.8500,
  'Check whether the clause is limited to fraud prevention, chargebacks, legal compliance, or broad discretionary hold authority.'
),
(
  'Account Suspension Authority',
  'account_control',
  'Account Suspension Authority',
  '["suspend your account", "suspend account", "limit your account", "restrict access", "terminate your account", "close your account"]'::jsonb,
  '[]'::jsonb,
  'high',
  0.8000,
  'Check surrounding conditions and whether notice/appeal is described.'
),
(
  'Strong KYC Requirement',
  'kyc_verification',
  'Strong KYC Requirement',
  '["identity verification", "government-issued ID", "proof of address", "source of funds", "business verification", "beneficial owner", "additional information"]'::jsonb,
  '[]'::jsonb,
  'medium',
  0.7500,
  'KYC may be standard for regulated payment platforms; level depends on consequences and clarity.'
),
(
  'Mandatory Arbitration',
  'appeal_clarity',
  'Mandatory Arbitration',
  '["binding arbitration", "mandatory arbitration", "class action waiver", "informal dispute resolution", "exclusive jurisdiction"]'::jsonb,
  '[]'::jsonb,
  'medium',
  0.7000,
  'Legal process terms should be described neutrally, not as misconduct.'
),
(
  'Data Retention Authority',
  'data_control',
  'Data Retention Authority',
  '["retain your data", "data retention", "retain information", "backup copies", "delete your data", "data export"]'::jsonb,
  '[]'::jsonb,
  'medium',
  0.7000,
  'Check whether retention periods and deletion/export rights are clearly stated.'
),
(
  'API Restriction',
  'api_developer_dependency',
  'API Restriction',
  '["API limit", "rate limit", "developer terms", "restrict API", "suspend API access", "deprecate", "usage limits"]'::jsonb,
  '[]'::jsonb,
  'medium',
  0.7000,
  'Relevant mainly for SaaS/vendor dependency profiles.'
)
on conflict do nothing;
