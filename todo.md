# 1. `schema.sql`

```sql
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
```

---

# 2. `BACKLOG.md`

````md
# Editorial Platform / Internal CMS — Build Backlog

## Build Principle

Build the data factory before the storefront.

The first MVP must prove this pipeline:

```text
Platform Intake
↓
Policy Discovery
↓
Candidate URL Review
↓
Source Registry
↓
Fetch / Extract / Hash
↓
Versioning
↓
Clause Split
↓
Signal Detection
↓
Human Review
↓
Evidence Builder
↓
Publisher
↓
Public Platform Profile
````

## MVP Definition of Done

MVP is complete when:

* Admin can create a platform.
* System can discover candidate policy URLs.
* Admin can approve candidate URLs into a Policy Source Registry.
* System can fetch, extract, normalize, and hash policy documents.
* System creates document versions.
* System splits document versions into sections and clauses.
* Signal Candidate Engine suggests policy signals.
* Admin can approve/reject/edit signals in Review Workbench.
* Admin can create evidence items.
* Publisher can generate a public platform profile.
* Hash monitor can detect a policy source change.
* Correction form can submit a correction request.

Initial test platforms:

* PayPal
* Wise
* GitHub
* Gumroad
* Vercel

---

# Epic 0 — Project Setup

## Issue 0.1 — Initialize App

Priority: Critical

Tasks:

* Create Next.js app.
* Add TypeScript.
* Add Tailwind.
* Add Supabase client.
* Add server-side Supabase service client.
* Configure environment variables.
* Add basic route structure.

Acceptance Criteria:

* App runs locally.
* Supabase connection works.
* Environment variables are documented.
* There is a basic `/admin` route.

---

## Issue 0.2 — Add Database Schema

Priority: Critical

Tasks:

* Apply `schema.sql` to Supabase/Postgres.
* Verify all tables are created.
* Verify indexes are created.
* Verify `updated_at` triggers work.
* Seed initial signal rules.

Acceptance Criteria:

* Schema applies cleanly.
* Initial signal rules exist.
* Insert/select works for `platforms`, `policy_sources`, and `signal_rules`.

---

## Issue 0.3 — Create Basic Admin Layout

Priority: High

Tasks:

* Build admin sidebar.
* Add routes:

  * `/admin`
  * `/admin/platforms`
  * `/admin/tasks`
  * `/admin/rules`
* Add simple auth guard placeholder.
* Add role assumptions for local development.

Acceptance Criteria:

* Admin UI has navigation.
* Admin routes render.
* Unauthorized public users cannot accidentally access admin routes in production mode.

---

# Epic 1 — Platform Registry

## Issue 1.1 — Platform List Page

Priority: Critical

Route:

```text
/admin/platforms
```

Tasks:

* List platforms.
* Show name, category, status, last reviewed date.
* Add filters:

  * category
  * status
  * needs review
* Add search by name/slug.

Acceptance Criteria:

* Admin can view all platforms.
* Admin can filter by category/status.
* Empty state exists.

---

## Issue 1.2 — Create Platform Form

Priority: Critical

Route:

```text
/admin/platforms/new
```

Fields:

* Name
* Slug
* Website URL
* Category
* Country
* Reason/internal notes

Tasks:

* Validate URL.
* Validate slug uniqueness.
* Insert into `platforms`.
* Create initial `editorial_tasks` row with `task_type = new_platform`.

Acceptance Criteria:

* Admin can create PayPal/Wise/GitHub test platforms.
* Duplicate slug is blocked.
* New platform appears in platform list.
* Initial editorial task is created.

---

## Issue 1.3 — Platform Detail Page

Priority: High

Route:

```text
/admin/platforms/[id]
```

Show:

* Platform metadata.
* Source count.
* Document version count.
* Signal count.
* Evidence count.
* Open editorial tasks.
* Last reviewed date.
* Internal notes.

Acceptance Criteria:

* Admin can open platform detail.
* Admin can edit platform metadata.
* Admin can see high-level coverage.

---

# Epic 2 — Policy Discovery

## Issue 2.1 — Build Discovery Service

Priority: Critical

Input:

* Platform ID
* Website URL

Discovery methods:

* Fetch homepage.
* Extract footer/header links.
* Look for legal/policy keywords.
* Try common paths:

  * `/terms`
  * `/terms-of-service`
  * `/privacy`
  * `/privacy-policy`
  * `/legal`
  * `/acceptable-use-policy`
  * `/fees`
  * `/refund-policy`
  * `/developer-terms`
  * `/api-terms`
  * `/dpa`
* Read `/robots.txt`.
* Read sitemap URLs if discoverable.

Output:

* Candidate URLs.
* Page title if available.
* Suggested document type.
* Suggested tier.
* Confidence.
* Detection reason.

Acceptance Criteria:

* Running discovery for Wise finds legal/privacy/terms-like URLs.
* Running discovery for PayPal finds legalhub-like URLs where accessible.
* Discovery does not follow unlimited links.
* Discovery stores a `discovery_runs` row.
* Discovery stores `source_candidates`.

---

## Issue 2.2 — Candidate URL Classification

Priority: Critical

Tasks:

* Implement rule-based classifier.
* Classify based on URL/title keywords.

Document type mapping examples:

* `terms`, `agreement` → terms/user agreement
* `privacy` → privacy_policy
* `acceptable-use`, `aup` → acceptable_use_policy
* `fees`, `pricing` → fees_page
* `payout`, `payment` → payout/payment_terms
* `developer`, `api` → developer/api terms
* `policy positions` → corporate_position
* `blog`, `newsroom` → context/ignore

Acceptance Criteria:

* Candidate URLs receive suggested document type.
* Candidate URLs receive suggested tier.
* Classifier marks obvious marketing/blog pages as low priority.
* Classifier result can be manually overridden later.

---

## Issue 2.3 — Discovery Run UI

Priority: High

Route:

```text
/admin/platforms/[id]/discovery
```

Tasks:

* Add “Run Discovery” button.
* Display latest discovery runs.
* Display candidate count.
* Display discovery status/errors.

Acceptance Criteria:

* Admin can trigger discovery from platform page.
* Admin can inspect discovery results.
* Failed discovery shows useful error.

---

# Epic 3 — Candidate URL Review and Source Registry

## Issue 3.1 — Candidate Review Page

Priority: Critical

Route:

```text
/admin/source-candidates
/admin/platforms/[id]/candidates
```

Show:

* URL
* Title
* Suggested document type
* Suggested tier
* Confidence
* Detection reason
* Status

Actions:

* Approve as source
* Reject
* Edit document type
* Edit source tier
* Toggle `use_for_scoring`
* Toggle `monitor_enabled`

Acceptance Criteria:

* Admin can approve a candidate.
* Approved candidate creates a `policy_sources` row.
* Admin can reject a candidate.
* Rejected candidate does not become a source.
* Admin can override suggested type/tier before approval.

---

## Issue 3.2 — Policy Source Registry Page

Priority: Critical

Route:

```text
/admin/platforms/[id]/sources
```

Show:

* Source title
* URL
* Document type
* Tier
* Use for scoring
* Monitor enabled
* Status
* Current hash
* Last fetched
* Last reviewed

Actions:

* Add source manually
* Edit source
* Enable/disable monitor
* Mark deprecated
* Mark ignored
* Delete draft source if unused

Acceptance Criteria:

* Admin can manage approved policy sources.
* Registry is the only source used by fetch/monitor jobs.
* Manual source creation works.

---

# Epic 4 — Fetcher / Extractor / Versioning

## Issue 4.1 — Policy Fetcher

Priority: Critical

Tasks:

* Implement fetch service.
* Respect per-domain delay.
* Record HTTP status.
* Record final URL after redirect.
* Record content type.
* Record response size.
* Save fetch logs.

Acceptance Criteria:

* Admin can fetch a policy source.
* Fetch result creates a `fetch_logs` row.
* Fetch errors do not crash app.
* 403/404/timeout are handled and visible.

---

## Issue 4.2 — Text Extractor

Priority: Critical

Tasks:

* Extract readable text from HTML.
* Remove boilerplate if possible.
* Return plain text.
* Return markdown-like text if possible.
* Estimate extraction confidence.
* Store extraction method.

Acceptance Criteria:

* Extractor works on at least 3 test URLs.
* If extraction returns too little text, mark as low confidence.
* Extracted text can be previewed in admin UI.

---

## Issue 4.3 — Manual Text Import

Priority: High

Route:

```text
/admin/sources/[id]/manual-import
```

Tasks:

* Allow admin to paste policy text.
* Allow effective date input.
* Create document version from pasted text.
* Mark extraction method as `manual`.

Acceptance Criteria:

* Admin can manually create document version when extractor fails.
* Manual imported version gets hash/version number.
* Manual version appears in version list.

---

## Issue 4.4 — Hash and Document Versioning

Priority: Critical

Tasks:

* Normalize text.
* Generate SHA-256 hash.
* Compare against latest source hash.
* Create document version if hash is new.
* Avoid duplicate versions.
* Update `policy_sources.current_hash`.
* Update `policy_sources.last_fetched_at`.

Acceptance Criteria:

* Same text does not create duplicate document version.
* Changed text creates new version.
* Version numbers increment per policy source.
* New version has `review_status = unreviewed`.

---

## Issue 4.5 — Source Detail and Version List UI

Priority: High

Route:

```text
/admin/sources/[id]
```

Show:

* Source metadata.
* Fetch button.
* Current hash.
* Version list.
* Latest extracted text preview.
* Fetch logs.

Acceptance Criteria:

* Admin can inspect source health.
* Admin can fetch source from UI.
* Admin can open document versions.

---

# Epic 5 — Section / Clause Processing

## Issue 5.1 — Section Splitter

Priority: High

Tasks:

* Split markdown/text into sections.
* Detect headings:

  * Markdown headings
  * Numbered headings
  * ALL CAPS headings
* Store sections.

Acceptance Criteria:

* Document version can be processed into sections.
* Section order is preserved.
* Fallback section exists if no headings found.

---

## Issue 5.2 — Clause Splitter

Priority: Critical

Tasks:

* Split sections into clauses.
* Split by paragraphs, bullets, numbered items.
* Generate clause hash.
* Count words.
* Store clauses.

Acceptance Criteria:

* Clauses are generated for document version.
* Clause order is preserved.
* Admin can view clauses by document version.

---

## Issue 5.3 — Clause Viewer UI

Priority: High

Route:

```text
/admin/documents/[version_id]/clauses
```

Show:

* Section heading
* Clause text
* Clause hash
* Word count
* Candidate signals count

Acceptance Criteria:

* Admin can read policy by section/clause.
* Admin can search within clauses.
* Admin can trigger signal detection for document version.

---

# Epic 6 — Signal Candidate Engine

## Issue 6.1 — Signal Rule Manager UI

Priority: High

Route:

```text
/admin/rules
```

Tasks:

* List rules.
* Create rule.
* Edit rule.
* Enable/disable rule.
* Edit keywords.
* Edit suggested level.
* Edit false-positive notes.

Acceptance Criteria:

* Admin can manage signal rules.
* Disabled rules are not used by detector.
* Existing seed rules are visible.

---

## Issue 6.2 — Rule-Based Signal Detection

Priority: Critical

Tasks:

* Load enabled rules.
* Scan clauses.
* Match keywords and regex.
* Create `signal_candidates`.
* Store matched terms.
* Store confidence score.
* Avoid duplicate candidates for same clause/rule.

Acceptance Criteria:

* Running detector on a document creates candidates.
* Candidates include matched terms.
* Candidates are not public.
* Detector can be re-run without duplicate spam.

---

## Issue 6.3 — Signal Candidate Review Queue

Priority: Critical

Route:

```text
/admin/review/signals
```

Show:

* Platform
* Source
* Document
* Clause excerpt
* Suggested signal
* Suggested category
* Suggested level
* Confidence
* Matched terms
* Status

Filters:

* Platform
* Category
* Status
* Confidence

Acceptance Criteria:

* Admin can view pending candidates.
* Admin can filter candidates.
* Admin can open candidate detail.

---

# Epic 7 — Review Workbench and Evidence Builder

## Issue 7.1 — Signal Candidate Detail

Priority: Critical

Route:

```text
/admin/review/signals/[id]
```

Show:

* Full clause text.
* Surrounding section context.
* Source URL.
* Document title.
* Suggested signal.
* Matched terms.
* Suggested level.
* False-positive notes from rule.

Actions:

* Approve
* Reject
* Mark needs deeper review

Acceptance Criteria:

* Admin can approve/reject candidate.
* Decision is logged.
* Candidate status updates.

---

## Issue 7.2 — Approve Candidate into Signal

Priority: Critical

Tasks:

* On approve, create `signals` row.
* Allow admin to edit:

  * signal name
  * category
  * level
  * confidence
  * explanation
  * internal reason
* Set signal status to `approved` or `draft`.

Acceptance Criteria:

* Approved candidate creates signal.
* Signal remains non-public until published.
* Admin can edit wording before saving.

---

## Issue 7.3 — Evidence Builder

Priority: Critical

Tasks:

* Create evidence from approved signal + clause.
* Auto-fill:

  * clause excerpt
  * source URL
  * document title
  * review date
* Admin fills:

  * explanation
  * why it matters
  * visibility
  * status

Acceptance Criteria:

* Evidence item can be created from signal review screen.
* Evidence requires source URL, excerpt, explanation, review date.
* Evidence can be marked approved/published.
* No signal should be publishable without at least one evidence item.

---

## Issue 7.4 — Safe Wording Checker

Priority: High

Tasks:

* Add unsafe word detector for public explanation fields.
* Flag words:

  * scam
  * fraud
  * theft
  * steal
  * illegal
  * criminal
  * evil
  * will hold your money
  * will ban your account
* Show safer phrasing suggestions.

Acceptance Criteria:

* Unsafe wording is flagged before publishing.
* Admin can still save internal notes.
* Public explanation requires review if unsafe wording appears.

---

# Epic 8 — Editorial Queue

## Issue 8.1 — Unified Task Queue

Priority: High

Route:

```text
/admin/tasks
```

Show:

* Task title
* Task type
* Platform
* Status
* Priority
* Assigned to
* Created at
* Due at

Acceptance Criteria:

* Admin can see all tasks.
* Admin can filter by type/status/priority.
* Admin can update task status.

---

## Issue 8.2 — Auto-Create Tasks

Priority: High

Create tasks when:

* New platform is created.
* Discovery run completes with candidates.
* Candidate needs review.
* New document version is created.
* Policy change detected.
* Signal candidate created.
* Correction request submitted.

Acceptance Criteria:

* Important events create editorial tasks.
* Tasks link to related entity.
* No duplicate tasks for same unresolved entity.

---

## Issue 8.3 — Editorial Decision Log

Priority: Medium

Tasks:

* Log approve/reject actions.
* Log signal level changes.
* Log evidence publish actions.
* Log source approval/rejection.

Acceptance Criteria:

* Admin can inspect decision history.
* Logs include actor, action, reason, timestamp.

---

# Epic 9 — Publisher and Public Profile

## Issue 9.1 — Platform Profile Generator

Priority: Critical

Tasks:

* Generate platform profile from:

  * platform metadata
  * published signals
  * published evidence
  * policy sources
  * alternatives
* Store in `platform_profiles`.

Acceptance Criteria:

* Admin can generate profile for a platform.
* Generated profile includes signal summary.
* Generated profile includes last reviewed date.
* Generated profile does not include draft/private evidence.

---

## Issue 9.2 — Platform Profile Preview

Priority: Critical

Route:

```text
/admin/platforms/[id]/preview
```

Show:

* Public summary.
* Signal levels.
* Evidence excerpts.
* Policy sources.
* Alternatives.
* Disclaimer.

Acceptance Criteria:

* Admin can preview before publishing.
* Preview clearly labels unpublished state.

---

## Issue 9.3 — Publish / Unpublish Profile

Priority: Critical

Tasks:

* Publish profile.
* Set `platform_profiles.profile_status = published`.
* Set `platform_profiles.last_published_at`.
* Set related signals/evidence to published where appropriate.
* Create public changelog entry.

Acceptance Criteria:

* Published profile is visible on public route.
* Unpublished profile is hidden.
* Changelog entry is created.

---

## Issue 9.4 — Public Platform Page

Priority: Critical

Route:

```text
/platforms/[slug]
```

Show:

* Platform name.
* Category.
* Official website.
* Last reviewed date.
* Policy Intelligence Summary.
* Signal levels.
* Evidence excerpts.
* Source URLs.
* Possible alternatives.
* Correction link.
* Disclaimer.

Acceptance Criteria:

* Public page renders from published data.
* No draft/internal data appears.
* Evidence links to official sources.
* Page has correction CTA.

---

## Issue 9.5 — Public Platform Directory

Priority: High

Route:

```text
/platforms
```

Show:

* Published platforms.
* Category.
* Key signal levels.
* Last reviewed date.

Filters:

* Category
* Money control
* Account control
* Data control
* Appeal clarity

Acceptance Criteria:

* Directory only shows published platforms.
* Filters work.
* Each platform links to profile.

---

# Epic 10 — Monitoring and Change Review

## Issue 10.1 — Monitor Scheduler

Priority: High

Tasks:

* Implement scheduled job.
* Select `policy_sources` where `monitor_enabled = true`.
* Fetch/extract/hash each source.
* Respect rate limits.

Acceptance Criteria:

* Scheduler can be run manually.
* Scheduler can run via cron.
* Monitor only checks approved registry sources.

---

## Issue 10.2 — Hash Change Detection

Priority: Critical

Tasks:

* Compare latest hash with new hash.
* If changed:

  * create document version
  * create `policy_changes`
  * create editorial task
  * set source status to `changed` or `needs_review`

Acceptance Criteria:

* Changed source produces policy change record.
* Unchanged source does not create duplicate version.
* Public data does not auto-update signal levels.

---

## Issue 10.3 — Change Review Queue

Priority: High

Route:

```text
/admin/review/changes
```

Show:

* Platform.
* Source.
* Old version.
* New version.
* Detected at.
* Status.
* Importance.

Actions:

* Mark minor.
* Mark important.
* Ignore.
* Review document.
* Run signal detector.
* Publish changelog.

Acceptance Criteria:

* Admin can review policy changes.
* Admin can classify importance.
* Ignored changes do not appear as unresolved.

---

## Issue 10.4 — Staleness Warning

Priority: Medium

Tasks:

* Define stale threshold:

  * default 90 days since last reviewed.
* Show internal stale warning.
* Show public warning if published profile is stale.

Acceptance Criteria:

* Admin dashboard shows stale profiles.
* Public profile shows “Last reviewed over 90 days ago” warning when stale.

---

# Epic 11 — Correction and Suggest Platform

## Issue 11.1 — Public Correction Form

Priority: High

Route:

```text
/correction
```

Fields:

* Platform
* Issue type
* Message
* Source URL
* Contact email

Acceptance Criteria:

* Public user can submit correction.
* Record is saved to `correction_requests`.
* Editorial task is created.
* No correction is public by default.

---

## Issue 11.2 — Correction Manager

Priority: High

Route:

```text
/admin/corrections
```

Actions:

* View correction.
* Accept.
* Reject.
* Request more info.
* Link to platform/source/signal/evidence.
* Add admin response.

Acceptance Criteria:

* Admin can process correction.
* Status updates.
* Decision is logged.

---

## Issue 11.3 — Suggest Platform Form

Priority: Medium

Route:

```text
/suggest-platform
```

Fields:

* Platform name.
* Website URL.
* Suggested category.
* Reason.
* Optional policy URL.
* Contact email.

Acceptance Criteria:

* User can suggest platform.
* Request saved to `suggest_platform_requests`.
* Admin can review later.

---

# Epic 12 — Alternatives

## Issue 12.1 — Alternative Mapping Manager

Priority: Medium

Route:

```text
/admin/platforms/[id]/alternatives
```

Fields:

* Alternative platform.
* Alternative name.
* Alternative URL.
* Use case.
* Best for.
* Tradeoff.
* Country availability note.
* Notes.
* Status.

Acceptance Criteria:

* Admin can add alternative mapping.
* Published alternatives appear on public platform page.
* Draft alternatives remain hidden.

---

# Epic 13 — Initial Data Seeding

## Issue 13.1 — Add Initial Test Platforms

Priority: Critical

Platforms:

* PayPal
* Wise
* GitHub
* Gumroad
* Vercel

Acceptance Criteria:

* All 5 platforms exist in registry.
* Each has category and website URL.
* Discovery can be run for each.

---

## Issue 13.2 — Create First Published Profile

Priority: Critical

Target:

* Wise or GitHub first, because they are usually easier than PayPal.

Acceptance Criteria:

* One platform has approved sources.
* At least one document version exists.
* At least five clauses are reviewed.
* At least three signals are approved.
* At least three evidence items are published.
* Public platform page renders correctly.

---

## Issue 13.3 — PayPal Stress Test

Priority: High

Purpose:

* Validate complex legalhub / multi-document platform.

Acceptance Criteria:

* PayPal source registry has at least:

  * User Agreement or equivalent
  * Privacy Policy
  * Fees or payment-related page
  * Policy updates/legalhub if relevant
* System can handle multiple policy sources.
* Public profile can aggregate signals across multiple documents.

---

# Epic 14 — Public Methodology / Editorial Safety

## Issue 14.1 — Methodology Page

Priority: Critical

Route:

```text
/methodology
```

Must explain:

* What policy signals mean.
* How evidence is selected.
* What signal levels mean.
* What confidence means.
* What sources are used.
* Role of automation.
* Role of human review.
* Limitations.

Acceptance Criteria:

* Page is public.
* Page clearly states product is not legal advice.
* Page explains “No evidence, no claim.”

---

## Issue 14.2 — Editorial Policy Page

Priority: Critical

Route:

```text
/editorial-policy
```

Must include:

* Safe wording rules.
* Correction process.
* Source quotation rules.
* No full policy republishing.
* No claims of illegality unless backed by official legal findings.
* Sponsored/affiliate disclosure placeholder.

Acceptance Criteria:

* Page is public.
* Page links from footer and platform pages.

---

## Issue 14.3 — Disclaimer Component

Priority: High

Tasks:

* Create reusable disclaimer component.
* Add to platform pages.
* Add to reports later.

Text should say:

```text
This analysis is an editorial interpretation of public policy text reviewed on a specific date. It is not legal advice and does not claim that any platform has acted illegally. Always verify current official policies before making decisions.
```

Acceptance Criteria:

* Disclaimer appears on all public platform pages.
* Disclaimer appears near evidence section or footer.

---

# Epic 15 — Internal Search

## Issue 15.1 — Basic Clause Search

Priority: Medium

Route:

```text
/admin/search
```

Search across:

* Platforms
* Policy sources
* Clauses
* Signals
* Evidence

Acceptance Criteria:

* Admin can search “hold funds”.
* Results show matching clauses and platform/source.
* Results link to review screen.

---

# Epic 16 — Future Paid-Ready, Not MVP

Do not build yet.

## Future Features

* User accounts.
* Watchlist.
* Email alerts.
* PDF export.
* Advanced compare.
* Checklists.
* API access.
* Recommendation wizard.
* Public contributor submissions.
* Browser extension.
* AI-assisted clause extraction.

These are blocked until:

* Editorial Platform works.
* At least 10 high-quality platform profiles exist.
* Public pages have early traffic or real user feedback.

---

# Critical Path Summary

Build in this order:

1. Schema + project setup.
2. Platform Registry.
3. Discovery Agent.
4. Candidate URL Review.
5. Policy Source Registry.
6. Fetcher / Extractor / Versioning.
7. Clause Splitter.
8. Signal Candidate Engine.
9. Signal Review Workbench.
10. Evidence Builder.
11. Publisher.
12. Public Platform Page.
13. Hash Monitor.
14. Correction Form.

Do not start paid features before this pipeline works end-to-end.

````

# 2. Editorial Platform MVP Backlog

## Epic 0 — Project Setup

### Goal

Establish a working Next.js and Supabase foundation so every later MVP feature can be built inside a stable authenticated admin shell.

### Issue 0.1 — Initialize Next.js

Priority:
Critical

Description:
Create the base Next.js application with the App Router, TypeScript, linting, environment variable loading, and a minimal route structure that future admin modules can extend without rework.

Routes (if applicable)
- `/`
- `/admin`

Database tables involved
- None directly.

Implementation tasks
- Initialize the Next.js project in the current repository without replacing existing files.
- Enable TypeScript and ensure the app builds with strict enough settings for production work.
- Configure package scripts for local development, production build, linting, and type-checking.
- Add a minimal App Router structure with a landing page and an admin entry route.
- Add environment variable loading for Supabase URL and keys, and fail clearly when required values are missing.
- Create shared folders for lib, server utilities, and admin features so later issues have a predictable structure.

Acceptance Criteria
- `npm install` and `npm run dev` start successfully in a clean environment.
- `/` and `/admin` render without runtime errors.
- Missing required environment variables produce a clear startup or request-time error.
- The repository contains a predictable application structure for later admin modules.

Dependencies
- None.

Future Notes (optional)
- Keep the initial structure shallow; defer heavy abstractions until at least Epic 3 is implemented.

--------------------------------------------------------

### Issue 0.2 — Configure Supabase

Priority:
Critical

Description:
Set up browser, server, and privileged Supabase access patterns so authenticated admin routes and backend workflows can read and write platform data safely.

Routes (if applicable)
- `/admin`
- `/login`

Database tables involved
- `profiles`

Implementation tasks
- Create a browser-safe Supabase client for interactive admin pages.
- Create a server-side Supabase client for protected page loads and server actions.
- Create a privileged service client for internal jobs that require broader database access.
- Centralize environment validation for Supabase URL, anon key, and service role key.
- Define a single place for shared typed database access helpers.
- Verify the app can read and write a simple record through Supabase without adding new schema.

Acceptance Criteria
- Server-side code can query `profiles` successfully.
- Browser-authenticated requests can access the current session without exposing the service key.
- Service-role operations are isolated to server-only execution paths.
- Supabase configuration errors are easy to diagnose from logs or the UI.

Dependencies
- Issue 0.1

Future Notes (optional)
- Generate typed database definitions later if the team standardizes that workflow.

--------------------------------------------------------

### Issue 0.3 — Apply schema.sql

Priority:
Critical

Description:
Apply the existing schema to the target Supabase Postgres instance and verify that the baseline tables, indexes, triggers, and seed data needed for the MVP are present and usable.

Routes (if applicable)
- None.

Database tables involved
- `profiles`
- `platforms`
- `discovery_runs`
- `source_candidates`
- `policy_sources`
- `fetch_logs`
- `document_versions`
- `policy_changes`
- `sections`
- `clauses`
- `signal_rules`
- `signal_candidates`
- `signals`
- `evidence_items`
- `platform_profiles`
- `public_changelogs`
- `editorial_tasks`
- `editorial_decision_logs`
- `correction_requests`
- `suggest_platform_requests`
- `alternative_mappings`

Implementation tasks
- Apply the existing schema file to the configured Supabase database without regenerating or rewriting the SQL.
- Verify the `pgcrypto` extension exists.
- Verify `set_updated_at()` exists and is attached to every table expected to use it.
- Verify the unique indexes and search indexes defined in the schema are present.
- Verify the initial `signal_rules` seed rows were inserted.
- Smoke-test insert and read operations against representative tables such as `platforms`, `policy_sources`, and `signal_rules`.

Acceptance Criteria
- The schema applies without manual SQL edits.
- Core tables listed above exist in Supabase.
- Trigger-managed `updated_at` columns change on update for representative tables.
- Seeded `signal_rules` rows are queryable after schema application.

Dependencies
- Issue 0.2

Future Notes (optional)
- Add repeatable migration tooling after the MVP path is stable.

--------------------------------------------------------

### Issue 0.4 — Admin Layout

Priority:
High

Description:
Build the shared admin shell used by all internal routes, including sidebar navigation, page header, content area, and baseline loading and error states.

Routes (if applicable)
- `/admin`
- `/admin/platforms`
- `/admin/discovery`
- `/admin/sources`
- `/admin/clauses`
- `/admin/rules`
- `/admin/review`

Database tables involved
- None directly.

Implementation tasks
- Create a reusable admin layout wrapper for all internal pages.
- Add sidebar navigation sections that match the MVP workflow order.
- Add page title and breadcrumb support so deeper pages remain navigable.
- Create shared empty-state, loading-state, and error-state patterns.
- Make the layout usable on both desktop and narrow laptop widths.
- Reserve space for future route-level status badges without blocking the MVP.

Acceptance Criteria
- All implemented admin routes render inside one consistent layout.
- Navigation clearly indicates the active route.
- Layout-level loading and error states do not break page rendering.
- New admin pages can be added without duplicating shell code.

Dependencies
- Issue 0.1

Future Notes (optional)
- Avoid coupling the shell to any one epic-specific data query.

--------------------------------------------------------

### Issue 0.5 — Authentication

Priority:
Critical

Description:
Protect admin functionality behind Supabase authentication and role-aware profile checks so only authorized internal users can access editorial workflows.

Routes (if applicable)
- `/login`
- `/admin`
- `/admin/*`

Database tables involved
- `profiles`

Implementation tasks
- Implement login and logout flows using Supabase Auth.
- Map authenticated users to `profiles` records by matching the auth user ID.
- Create an auth guard for admin routes that blocks anonymous users.
- Enforce role checks so `viewer` cannot access admin mutation workflows.
- Add a clear access-denied state for authenticated users with insufficient role.
- Define the bootstrap behavior for a missing `profiles` row so the failure mode is explicit.

Acceptance Criteria
- Anonymous users are redirected away from `/admin/*`.
- Authenticated users with allowed roles can load admin pages.
- Authenticated users with disallowed roles receive a clear denial state.
- Session state survives navigation and refresh within the app.

Dependencies
- Issue 0.2
- Issue 0.4

Future Notes (optional)
- Add password reset and invite flows after the MVP backlog is live.

--------------------------------------------------------

### Issue 0.6 — Navigation

Priority:
High

Description:
Define the permanent admin route map and navigation behavior for the MVP so later issues can rely on consistent URLs, labels, and workflow ordering.

Routes (if applicable)
- `/admin`
- `/admin/platforms`
- `/admin/discovery`
- `/admin/sources`
- `/admin/clauses`
- `/admin/rules`
- `/admin/review`

Database tables involved
- None directly.

Implementation tasks
- Create a central route configuration for admin sections and page labels.
- Align navigation labels with Epic 1 through Epic 7 terminology.
- Hide or disable links for pages that are not yet implemented while keeping route placeholders stable.
- Add support for deep links from list pages into detail pages and back.
- Ensure route names are consistent with the rest of the backlog so agents do not invent alternate paths.

Acceptance Criteria
- Every MVP module from Platform Registry through Review Workbench has a reserved admin route.
- Navigation labels match the backlog naming closely enough to avoid duplicate concepts.
- Moving between list and detail routes is predictable and consistent.
- Route changes do not require hardcoded link edits in multiple files.

Dependencies
- Issue 0.4
- Issue 0.5

Future Notes (optional)
- Add task-count badges after `editorial_tasks` is integrated into queue pages.

--------------------------------------------------------

## Epic 1 — Platform Registry

### Goal

Create the admin workflows for adding, browsing, editing, and managing the platform records that anchor all discovery, policy, clause, and signal data.

### Issue 1.1 — Platform List

Priority:
Critical

Description:
Build the main platform index page so editors can browse all tracked platforms, filter by status and category, and jump into each platform's operational detail page.

Routes (if applicable)
- `/admin/platforms`

Database tables involved
- `platforms`
- `policy_sources`
- `signals`
- `editorial_tasks`

Implementation tasks
- Query paginated platform records ordered by the most recently updated or reviewed items.
- Show columns for name, slug, category, status, country, and last reviewed date.
- Add search by name and slug.
- Add filters for category and status.
- Show lightweight counts or badges for related sources, signals, or open tasks where efficient.
- Provide clear empty states and error states.

Acceptance Criteria
- Admin can browse all platforms from one page.
- Search finds a platform by partial name or exact slug.
- Filters update the list without breaking pagination.
- Each row links to the correct platform detail route.

Dependencies
- Issue 0.4
- Issue 0.5
- Issue 0.6

Future Notes (optional)
- Add bulk actions only after the single-platform flows are stable.

--------------------------------------------------------

### Issue 1.2 — Platform Detail

Priority:
High

Description:
Create the primary platform detail page that summarizes metadata, workflow coverage, and linked records so an editor can operate on a platform from one hub.

Routes (if applicable)
- `/admin/platforms/[id]`

Database tables involved
- `platforms`
- `policy_sources`
- `document_versions`
- `signals`
- `evidence_items`
- `editorial_tasks`

Implementation tasks
- Load the platform record and related high-level counts.
- Show website URL, category, status, country, summary, internal notes, and last reviewed date.
- Show links to discovery runs, source registry, clauses, signal review, and evidence where available.
- Surface open editorial tasks associated with the platform.
- Handle not-found and deleted-record states explicitly.

Acceptance Criteria
- Admin can open a platform and see its key metadata and coverage metrics.
- Linked counts reflect the current database state.
- Platform detail acts as the navigation hub for downstream workflow pages.
- Missing platforms return a clear not-found state.

Dependencies
- Issue 1.1

Future Notes (optional)
- Add activity timeline widgets once decision logging is visible in the UI.

--------------------------------------------------------

### Issue 1.3 — Create Platform

Priority:
Critical

Description:
Allow an editor to create a new platform record with the minimum information required to start the discovery and editorial pipeline.

Routes (if applicable)
- `/admin/platforms/new`

Database tables involved
- `platforms`
- `editorial_tasks`

Implementation tasks
- Build a create form for name, slug, website URL, category, country, summary, and internal notes.
- Normalize and validate URLs before insert.
- Validate slug uniqueness before insert and enforce server-side duplicate handling.
- Insert the new `platforms` row with the current user as `created_by`.
- Create a companion `editorial_tasks` row with `task_type = 'new_platform'`.
- Redirect to the new platform detail page on success.

Acceptance Criteria
- Admin can create a valid platform from the UI.
- Duplicate slugs are blocked with a clear error.
- Newly created platforms appear in the platform list immediately.
- An initial editorial task exists for the new platform after creation.

Dependencies
- Issue 1.1
- Issue 0.5

Future Notes (optional)
- Add duplicate-domain detection later if platform volume increases.

--------------------------------------------------------

### Issue 1.4 — Edit Platform

Priority:
High

Description:
Provide an edit workflow for updating core platform fields while preserving an audit trail for important metadata changes.

Routes (if applicable)
- `/admin/platforms/[id]/edit`

Database tables involved
- `platforms`
- `editorial_decision_logs`

Implementation tasks
- Build an edit form seeded from the current platform record.
- Allow updates to name, slug, website URL, category, country, summary, internal notes, and last reviewed date.
- Re-run validation rules used during creation, including slug uniqueness and URL normalization.
- Write an `editorial_decision_logs` entry for meaningful metadata changes.
- Return the editor to the platform detail page with updated values after success.

Acceptance Criteria
- Admin can update platform metadata from the UI.
- Invalid updates are rejected without partial writes.
- `updated_at` changes after a successful edit.
- A decision log row is created for tracked changes.

Dependencies
- Issue 1.2

Future Notes (optional)
- Add field-level diff display once decision logs are surfaced in the UI.

--------------------------------------------------------

### Issue 1.5 — Platform Status

Priority:
High

Description:
Implement explicit status management for platforms so editors can mark records as draft, active, archived, or needing review as the pipeline progresses.

Routes (if applicable)
- `/admin/platforms`
- `/admin/platforms/[id]`

Database tables involved
- `platforms`
- `editorial_tasks`
- `editorial_decision_logs`

Implementation tasks
- Add status controls for `draft`, `active`, `archived`, and `needs_review`.
- Define when status changes are allowed and block destructive transitions where appropriate.
- Update or create `editorial_tasks` entries when a platform is moved into `needs_review`.
- Record status transitions in `editorial_decision_logs`.
- Reflect status visually in list and detail pages.

Acceptance Criteria
- Admin can change platform status through the UI.
- Invalid transitions are blocked with a clear message.
- Status changes are visible immediately in list and detail views.
- Status changes that require follow-up create or update an editorial task.

Dependencies
- Issue 1.1
- Issue 1.2
- Issue 1.4

Future Notes (optional)
- Add bulk status updates only after the single-record workflow is proven.

--------------------------------------------------------

### Issue 1.6 — Platform Metadata

Priority:
Medium

Description:
Define and render the metadata contract for a platform so every later module can rely on consistent fields, normalized values, and derived display information.

Routes (if applicable)
- `/admin/platforms/[id]`
- `/admin/platforms/[id]/edit`

Database tables involved
- `platforms`

Implementation tasks
- Standardize how category, country, website URL, summary, and internal notes are displayed and edited.
- Normalize website domains for consistent downstream discovery input.
- Decide which fields are required versus optional at create time and at edit time.
- Add display helpers for empty metadata so detail pages do not show ambiguous blanks.
- Ensure metadata fields are reusable by discovery, sources, and review pages without duplicate formatting logic.

Acceptance Criteria
- Platform metadata is displayed consistently across list, create, edit, and detail pages.
- Website URLs and categories are normalized before downstream workflows use them.
- Empty optional metadata is shown clearly rather than omitted silently.
- Later epics can consume platform metadata without redefining the contract.

Dependencies
- Issue 1.2
- Issue 1.4

Future Notes (optional)
- Add external IDs or tags only if a later integration requires them.

--------------------------------------------------------

## Epic 2 — Policy Discovery

### Goal

Automate the first-pass discovery of likely policy URLs for a platform and present the findings in a reviewable format before anything enters the official source registry.

### Issue 2.1 — Discovery Engine

Priority:
Critical

Description:
Implement the orchestration layer that starts a discovery run for a platform, executes discovery methods, and persists run and candidate results.

Routes (if applicable)
- `/admin/platforms/[id]/discovery`
- `/admin/discovery/runs/[id]`

Database tables involved
- `platforms`
- `discovery_runs`
- `source_candidates`
- `editorial_tasks`

Implementation tasks
- Accept a platform ID and normalized website URL as discovery input.
- Create a `discovery_runs` record before processing starts.
- Invoke the discovery strategies defined in Epic 2 and merge their candidate outputs.
- Deduplicate candidate URLs within a single run before insert.
- Persist candidates to `source_candidates` with confidence and detection metadata.
- Mark the run as `completed`, `failed`, or `partial` with an error message when appropriate.
- Optionally create a review-oriented `editorial_tasks` row after a successful run.

Acceptance Criteria
- Starting discovery creates a `discovery_runs` row tied to the platform.
- At least one successful run can store multiple `source_candidates`.
- Failed runs persist error information instead of failing silently.
- Duplicate candidate URLs from multiple strategies are not inserted multiple times for the same run.

Dependencies
- Issue 1.2
- Issue 1.6

Future Notes (optional)
- Move execution to a background job worker if request-time execution becomes too slow.

--------------------------------------------------------

### Issue 2.2 — Robots.txt Reader

Priority:
Medium

Description:
Fetch and parse `robots.txt` to identify sitemap declarations and policy-relevant disallowed or referenced paths that can inform discovery without broad crawling.

Routes (if applicable)
- `/admin/platforms/[id]/discovery`

Database tables involved
- `discovery_runs`
- `source_candidates`

Implementation tasks
- Request `/robots.txt` from the platform domain.
- Parse sitemap declarations and path hints from the file.
- Capture relevant metadata in the discovery run context for debugging.
- Convert useful policy-related paths into candidate URLs when they meet basic validity checks.
- Tolerate missing or invalid `robots.txt` responses without failing the whole run.

Acceptance Criteria
- Valid sitemap references from `robots.txt` are captured for later sitemap processing.
- Missing `robots.txt` returns do not abort the discovery run.
- Candidate URLs derived from `robots.txt` include a clear `detection_reason`.
- The discovery run records enough metadata to explain what the reader found or failed to find.

Dependencies
- Issue 2.1

Future Notes (optional)
- Keep parser behavior conservative; do not treat generic crawl directives as policy evidence by themselves.

--------------------------------------------------------

### Issue 2.3 — Sitemap Discovery

Priority:
High

Description:
Read sitemap URLs from `robots.txt` or common sitemap endpoints and extract policy-like URLs without attempting a general-purpose crawl.

Routes (if applicable)
- `/admin/platforms/[id]/discovery`

Database tables involved
- `discovery_runs`
- `source_candidates`

Implementation tasks
- Resolve sitemap URLs from the robots reader or common fallback locations.
- Fetch and parse XML sitemap indexes and nested sitemaps within reasonable limits.
- Extract absolute URLs from sitemap entries.
- Filter extracted URLs using policy-relevant path and hostname rules.
- Add qualifying URLs to the candidate set with a `detection_reason` that identifies the sitemap source.

Acceptance Criteria
- Discovery can extract candidate URLs from a valid sitemap or sitemap index.
- Nested sitemap traversal respects explicit request and depth limits.
- Non-policy sitemap entries are filtered out before candidate insert.
- Each sitemap-derived candidate records where it came from.

Dependencies
- Issue 2.1
- Issue 2.2

Future Notes (optional)
- Add gzip sitemap handling if target platforms commonly use it.

--------------------------------------------------------

### Issue 2.4 — Footer/Header Link Discovery

Priority:
High

Description:
Fetch the homepage and inspect primary navigation, footer blocks, and obvious legal hubs for links that likely point to policy or documentation pages.

Routes (if applicable)
- `/admin/platforms/[id]/discovery`

Database tables involved
- `discovery_runs`
- `source_candidates`

Implementation tasks
- Fetch the homepage HTML for the platform website.
- Extract anchor links from header, footer, and legal/navigation clusters.
- Normalize relative URLs to absolute URLs.
- Score links based on legal and policy-related text, path names, and surrounding markup context.
- Exclude non-http links, fragment-only links, and links to unrelated domains unless explicitly allowed.

Acceptance Criteria
- Legal or policy links present in the homepage footer or header are discovered as candidates.
- Relative links are stored as normalized absolute URLs.
- Obvious non-document links such as social, mailto, or javascript links are excluded.
- Candidate rows include a human-readable reason such as `footer_link` or `header_link`.

Dependencies
- Issue 2.1

Future Notes (optional)
- Add limited follow-up discovery for `/legal` hub pages only after the homepage strategy is stable.

--------------------------------------------------------

### Issue 2.5 — Candidate URL Generator

Priority:
Critical

Description:
Generate high-probability policy URLs from common path patterns so discovery still produces candidates when a site does not expose strong footer or sitemap signals.

Routes (if applicable)
- `/admin/platforms/[id]/discovery`

Database tables involved
- `discovery_runs`
- `source_candidates`

Implementation tasks
- Define a bounded list of common legal and policy URL paths.
- Combine the normalized platform origin with each path candidate.
- Optionally issue lightweight existence checks before inserting the candidate.
- Record which generated path produced each candidate.
- Prevent duplicate URLs from being inserted when the same path is also found by another strategy.

Acceptance Criteria
- The generator attempts the common policy paths defined in the backlog.
- Existing pages discovered by path generation are stored as candidates.
- Duplicate URLs from different strategies are merged into one candidate record per run.
- Generated candidates are clearly distinguishable from fetched link candidates.

Dependencies
- Issue 2.1
- Issue 1.6

Future Notes (optional)
- Keep the path list small and explicit; do not drift into generic site scanning.

--------------------------------------------------------

### Issue 2.6 — Candidate Classification

Priority:
Critical

Description:
Assign a suggested document type, suggested tier, and confidence score to each candidate so editors can prioritize likely policy sources quickly.

Routes (if applicable)
- `/admin/platforms/[id]/discovery`
- `/admin/sources/candidates`

Database tables involved
- `source_candidates`

Implementation tasks
- Define rule-based classification inputs from URL path, title text, anchor text, and detection source.
- Map likely pages into `suggested_document_type` values aligned with the `policy_sources.document_type` vocabulary.
- Map likely source importance into `suggested_tier` values aligned with the `policy_sources.source_tier` vocabulary.
- Assign a bounded numeric confidence score and a human-readable `detection_reason`.
- Reuse the classifier consistently across all discovery strategies.

Acceptance Criteria
- Candidates receive a suggested document type when enough evidence exists.
- Candidates receive a suggested tier that matches the existing source tier vocabulary.
- Confidence values are stored for review sorting.
- Classification remains deterministic for the same inputs.

Dependencies
- Issue 2.2
- Issue 2.3
- Issue 2.4
- Issue 2.5

Future Notes (optional)
- Do not introduce AI classification in the MVP; keep this rules-based and explainable.

--------------------------------------------------------

### Issue 2.7 — Discovery UI

Priority:
High

Description:
Provide the admin interface for starting discovery, reviewing run status, and inspecting discovered candidate URLs before they move into the candidate review queue.

Routes (if applicable)
- `/admin/platforms/[id]/discovery`
- `/admin/discovery/runs/[id]`

Database tables involved
- `platforms`
- `discovery_runs`
- `source_candidates`

Implementation tasks
- Add a platform-scoped page that can trigger a discovery run.
- Show run history with status, start time, completion time, and error summary.
- Show candidate rows with URL, title, suggested document type, tier, confidence, and detection reason.
- Make candidate rows link into the Epic 3 review flow.
- Provide clear handling for in-progress, failed, empty, and successful runs.

Acceptance Criteria
- Admin can start discovery from a platform page.
- Admin can see whether a run is running, completed, failed, or partial.
- Candidate URLs are visible with enough metadata to support review.
- Discovery UI links cleanly into the candidate review queue.

Dependencies
- Issue 2.1
- Issue 2.6
- Issue 0.4

Future Notes (optional)
- Add re-run and compare-run behavior only after the first stable end-to-end flow exists.

--------------------------------------------------------

## Epic 3 — Candidate Review & Policy Source Registry

### Goal

Turn discovered URLs into a controlled source registry by giving editors a queue, approval and rejection workflows, manual source entry, and source-level metadata management.

### Issue 3.1 — Candidate Queue

Priority:
Critical

Description:
Build the main review queue for discovered source candidates so editors can process pending URLs in a prioritized, filterable list.

Routes (if applicable)
- `/admin/sources/candidates`

Database tables involved
- `source_candidates`
- `platforms`
- `editorial_tasks`

Implementation tasks
- Query pending and manual-review candidates with platform context.
- Sort by status, confidence, creation time, and platform.
- Add filters for status, platform, suggested type, and suggested tier.
- Show the candidate URL, title, detection reason, and latest discovery run context.
- Link each item to approve or reject actions and to the originating platform page.
- Surface any open `editorial_tasks` associated with candidate review.

Acceptance Criteria
- Editors can see all pending candidates in one queue.
- Queue filters reduce the dataset correctly.
- Each candidate row contains enough information for a review decision.
- Queue items can be opened from the source registry and discovery UI consistently.

Dependencies
- Issue 2.7
- Issue 0.6

Future Notes (optional)
- Add assignment and due dates after the queue proves useful in practice.

--------------------------------------------------------

### Issue 3.2 — Approve Candidate

Priority:
Critical

Description:
Approve a discovered candidate into the official policy source registry while preserving source metadata and audit information.

Routes (if applicable)
- `/admin/sources/candidates`
- `/admin/sources/candidates/[id]`

Database tables involved
- `source_candidates`
- `policy_sources`
- `editorial_tasks`
- `editorial_decision_logs`

Implementation tasks
- Provide an approval action that confirms or edits the candidate title, document type, source tier, and monitor setting.
- Create a `policy_sources` row for the approved candidate.
- Update the `source_candidates.status` to `approved` and stamp reviewer fields.
- Create or update the relevant `editorial_tasks` record.
- Write an `editorial_decision_logs` entry capturing the approval action and resulting source metadata.
- Prevent duplicate source creation for the same platform URL when a registry row already exists.

Acceptance Criteria
- Approving a candidate creates one `policy_sources` row with the selected metadata.
- The candidate status becomes `approved` with reviewer and timestamp values.
- Duplicate platform and URL pairs are blocked gracefully.
- A decision log exists for the approval action.

Dependencies
- Issue 3.1

Future Notes (optional)
- Add merge-with-existing-source behavior if duplicate candidates become common.

--------------------------------------------------------

### Issue 3.3 — Reject Candidate

Priority:
High

Description:
Allow editors to reject false positives or irrelevant URLs from the candidate queue while preserving the reason for the decision.

Routes (if applicable)
- `/admin/sources/candidates`
- `/admin/sources/candidates/[id]`

Database tables involved
- `source_candidates`
- `editorial_tasks`
- `editorial_decision_logs`

Implementation tasks
- Add a rejection action with a required reason or structured reason code.
- Update the candidate status to `rejected` and stamp reviewer fields.
- Close or update the related `editorial_tasks` row if one exists.
- Write a corresponding `editorial_decision_logs` entry.
- Make rejected items visible through filters but excluded from the default pending queue.

Acceptance Criteria
- Editors can reject a candidate from the queue or detail view.
- Rejected candidates no longer appear in the default pending list.
- Rejection decisions preserve who rejected the candidate and why.
- Rejected state does not create a `policy_sources` row.

Dependencies
- Issue 3.1

Future Notes (optional)
- Add undo behavior only after approval and rejection flows stabilize.

--------------------------------------------------------

### Issue 3.4 — Manual Source

Priority:
Critical

Description:
Allow editors to create a policy source directly when discovery misses an important document or when a source is known in advance.

Routes (if applicable)
- `/admin/sources/new`
- `/admin/platforms/[id]/sources/new`

Database tables involved
- `policy_sources`
- `editorial_tasks`
- `editorial_decision_logs`

Implementation tasks
- Build a manual source creation form with platform, URL, title, document type, source tier, status, and monitor flag fields.
- Reuse the same validation rules as candidate approval for URL normalization and duplicate detection.
- Insert the `policy_sources` row directly without creating a `source_candidates` row.
- Optionally create a follow-up `editorial_tasks` row for fetch and extraction work.
- Record the manual creation in `editorial_decision_logs`.

Acceptance Criteria
- Editors can create a policy source without running discovery first.
- Duplicate platform and URL pairs are blocked.
- The new source appears in the source registry immediately.
- Manual source creation generates a clear audit entry.

Dependencies
- Issue 1.2
- Issue 0.5

Future Notes (optional)
- Support bulk import later if the team onboards large source sets manually.

--------------------------------------------------------

### Issue 3.5 — Policy Source Registry

Priority:
Critical

Description:
Build the canonical registry view for all approved policy sources so editors can search, filter, and open sources for fetch, versioning, and review workflows.

Routes (if applicable)
- `/admin/sources`

Database tables involved
- `policy_sources`
- `platforms`
- `document_versions`
- `fetch_logs`

Implementation tasks
- Query policy sources with platform context and basic related counts.
- Add filters for platform, document type, source tier, monitor enabled, and status.
- Add search by URL and title.
- Show last fetched time, current hash presence, and latest version count where efficient.
- Link each row to the source detail page.

Acceptance Criteria
- Editors can browse the complete source registry from one page.
- Filters and search return the expected subset of sources.
- Each source row exposes enough metadata to decide the next action.
- Registry rows link to the correct source detail route.

Dependencies
- Issue 3.2
- Issue 3.4

Future Notes (optional)
- Add saved filters after real editorial patterns emerge.

--------------------------------------------------------

### Issue 3.6 — Source Metadata

Priority:
High

Description:
Provide an edit workflow for source titles, URLs, types, status values, and related metadata so the registry stays accurate as source understanding improves.

Routes (if applicable)
- `/admin/sources/[id]`
- `/admin/sources/[id]/edit`

Database tables involved
- `policy_sources`
- `editorial_decision_logs`

Implementation tasks
- Build a source edit form seeded from the current `policy_sources` row.
- Allow editing of title, URL, final URL, document type, status, `use_for_scoring`, and last reviewed date.
- Validate updated URLs and preserve the unique platform and URL constraint.
- Record edits in `editorial_decision_logs`.
- Refresh dependent detail screens after successful save.

Acceptance Criteria
- Editors can update source metadata without corrupting the registry.
- Invalid edits are rejected cleanly.
- The source detail page reflects edits immediately after save.
- Decision logs capture what changed.

Dependencies
- Issue 3.5

Future Notes (optional)
- Keep URL edits explicit because later fetch and version data may rely on the original URL history.

--------------------------------------------------------

### Issue 3.7 — Source Tier

Priority:
High

Description:
Implement explicit source-tier controls so editors can mark whether a source is core, supporting, contextual, or ignored for later scoring and review workflows.

Routes (if applicable)
- `/admin/sources`
- `/admin/sources/[id]`

Database tables involved
- `policy_sources`
- `editorial_decision_logs`

Implementation tasks
- Expose source tier values aligned to the schema vocabulary.
- Add tier editing to approval, manual creation, and source edit workflows.
- Explain tier meaning in the UI to reduce accidental misuse.
- Record tier changes in `editorial_decision_logs`.
- Allow registry filtering and sorting by source tier.

Acceptance Criteria
- Editors can set and update source tier from all relevant source workflows.
- Tier values are limited to the schema-defined vocabulary.
- Tier values are visible in queue, registry, and detail screens.
- Tier changes are audit logged.

Dependencies
- Issue 3.2
- Issue 3.4
- Issue 3.6

Future Notes (optional)
- Add tier-based default monitor behavior later if it proves useful.

--------------------------------------------------------

### Issue 3.8 — Monitor Toggle

Priority:
Medium

Description:
Allow editors to enable or disable monitoring on a per-source basis so only selected sources participate in later change-detection workflows.

Routes (if applicable)
- `/admin/sources`
- `/admin/sources/[id]`

Database tables involved
- `policy_sources`
- `editorial_decision_logs`

Implementation tasks
- Add `monitor_enabled` controls to source approval, source edit, and registry views.
- Persist toggle changes on the `policy_sources` row.
- Record toggle changes in `editorial_decision_logs`.
- Make monitored sources visually distinct in the registry.
- Ensure later Epic 4 workflows can read the toggle consistently.

Acceptance Criteria
- Editors can enable or disable monitoring from the source UI.
- Toggle state persists across refresh and navigation.
- Registry filtering by monitored state works.
- Toggle changes are audit logged.

Dependencies
- Issue 3.5
- Issue 3.6

Future Notes (optional)
- Monitoring execution itself belongs after versioning is working end-to-end.

--------------------------------------------------------

## Epic 4 — Fetch / Extract / Versioning

### Goal

Turn approved sources into normalized document records by fetching content, extracting text, hashing outputs, creating versions, and exposing source-level history to editors.

### Issue 4.1 — Policy Fetcher

Priority:
Critical

Description:
Fetch approved policy source URLs and record request outcomes so the platform can build reliable document versions from current source content.

Routes (if applicable)
- `/admin/sources/[id]`
- `/admin/sources/[id]/fetch`

Database tables involved
- `policy_sources`
- `fetch_logs`

Implementation tasks
- Build a source-scoped fetch action that requests the current source URL.
- Capture requested URL, final URL, HTTP status, content type, response size, success flag, and error message in `fetch_logs`.
- Update `policy_sources.final_url` and `policy_sources.last_fetched_at` from successful fetches.
- Store enough response metadata for later extraction debugging.
- Handle redirects, timeouts, and non-HTML responses explicitly.

Acceptance Criteria
- Editors can trigger a fetch for a policy source.
- Each fetch attempt creates one `fetch_logs` record.
- Successful fetches update `last_fetched_at` and final URL metadata.
- Failed fetches retain an error message without crashing the source detail page.

Dependencies
- Issue 3.5
- Issue 3.8

Future Notes (optional)
- Move this to asynchronous execution if fetch latency blocks the admin UI.

--------------------------------------------------------

### Issue 4.2 — HTML Extractor

Priority:
Critical

Description:
Extract usable text from fetched HTML so the system can produce reviewable document versions even when source pages include heavy navigation or chrome.

Routes (if applicable)
- `/admin/sources/[id]`

Database tables involved
- `fetch_logs`
- `document_versions`

Implementation tasks
- Read the most recent successful fetched content for a source.
- Strip obvious boilerplate such as navigation, footer repetition, and scripts where feasible.
- Capture extracted plain text and a confidence or method label in `document_versions`.
- Preserve raw HTML storage references if the fetch pipeline stores them.
- Return a clear failure mode when extraction quality is too poor for automatic version creation.

Acceptance Criteria
- A successful HTML fetch can produce extracted text for version creation.
- Extracted text is materially cleaner than raw HTML page source.
- Extraction failures are stored with enough detail for manual follow-up.
- `document_versions.extraction_method` and `extraction_confidence` are set when a version is created.

Dependencies
- Issue 4.1

Future Notes (optional)
- Add PDF handling only if required by a real monitored source.

--------------------------------------------------------

### Issue 4.3 — Markdown Generator

Priority:
High

Description:
Generate normalized markdown from extracted document text so later section and clause processors can work from a consistent, reviewable representation.

Routes (if applicable)
- `/admin/sources/[id]`
- `/admin/sources/[id]/versions/[versionId]`

Database tables involved
- `document_versions`

Implementation tasks
- Convert extracted content into stable markdown that preserves headings and readable paragraph boundaries.
- Store markdown text on the `document_versions` row alongside plain text.
- Normalize whitespace and remove obvious duplicate blocks.
- Keep the transformation deterministic for identical source content.

Acceptance Criteria
- New document versions contain `markdown_text` when extraction succeeds.
- Markdown output preserves major heading structure where available.
- Identical source content produces materially identical markdown output.
- Editors can inspect the generated markdown from a version detail view.

Dependencies
- Issue 4.2

Future Notes (optional)
- Avoid adding rich markdown formatting that complicates later section splitting.

--------------------------------------------------------

### Issue 4.4 — Manual Import

Priority:
High

Description:
Allow editors to create a document version manually when automatic fetch or extraction is insufficient, while still keeping versioning and hash behavior consistent.

Routes (if applicable)
- `/admin/sources/[id]/import`

Database tables involved
- `policy_sources`
- `document_versions`
- `editorial_decision_logs`

Implementation tasks
- Build a manual import form that accepts markdown text, plain text, or pasted document content.
- Require the editor to associate the imported content with an existing `policy_sources` row.
- Generate the same hash and version metadata used by automatic extraction.
- Allow editors to set extraction method and optional effective date for the imported version.
- Record the manual import in `editorial_decision_logs`.

Acceptance Criteria
- Editors can create a new document version without an automated fetch.
- Manual imports participate in the same deduplication and version numbering rules as fetched versions.
- Imported versions are visible in the version history immediately.
- Manual import actions are audit logged.

Dependencies
- Issue 3.5
- Issue 4.3
- Issue 4.5

Future Notes (optional)
- Add file upload support later only if copy-paste import becomes too limiting.

--------------------------------------------------------

### Issue 4.5 — SHA256 Hash

Priority:
Critical

Description:
Compute stable content hashes for document text so the platform can detect duplicates, identify changes, and avoid creating redundant versions.

Routes (if applicable)
- `/admin/sources/[id]`
- `/admin/sources/[id]/versions`

Database tables involved
- `policy_sources`
- `document_versions`
- `policy_changes`

Implementation tasks
- Generate a SHA256 hash from the normalized document text used for versioning.
- Store the hash as `document_versions.text_hash`.
- Compare the new hash to `policy_sources.current_hash`.
- Skip duplicate version creation when the hash already exists for the source.
- Update `policy_sources.current_hash` after a new version is accepted.
- Create a `policy_changes` row when a monitored source hash changes and a prior version exists.

Acceptance Criteria
- New versions receive a stable hash based on normalized content.
- Re-fetching unchanged content does not create a duplicate version.
- A monitored source with changed content creates one `policy_changes` row.
- `policy_sources.current_hash` reflects the latest accepted version hash.

Dependencies
- Issue 4.2

Future Notes (optional)
- Keep hash input normalization explicit; small whitespace-only changes should not create noisy version churn unless intentionally preserved.

--------------------------------------------------------

### Issue 4.6 — Version Manager

Priority:
Critical

Description:
Create the version history workflow for a source so editors can inspect document snapshots, review extraction state, and understand change chronology.

Routes (if applicable)
- `/admin/sources/[id]/versions`
- `/admin/sources/[id]/versions/[versionId]`

Database tables involved
- `policy_sources`
- `document_versions`
- `policy_changes`

Implementation tasks
- List all versions for a source ordered by version number or fetched date.
- Show hash, review status, extraction method, effective date, and fetched date.
- Display version-to-version relationships where a policy change was detected.
- Allow editors to open a single version and inspect markdown and plain text.
- Make current and superseded versions visually distinct.

Acceptance Criteria
- Editors can browse the full version history for a source.
- Version rows show enough metadata to identify the current version.
- Individual version pages render the stored extracted content.
- Change records are visible when a monitored source has changed.

Dependencies
- Issue 4.3
- Issue 4.5

Future Notes (optional)
- Add diffing later; MVP only needs clear version history and version detail inspection.

--------------------------------------------------------

### Issue 4.7 — Fetch Logs

Priority:
Medium

Description:
Expose the fetch attempt history for each source so editors can diagnose unreachable sources, extraction failures, and redirect behavior.

Routes (if applicable)
- `/admin/sources/[id]/logs`

Database tables involved
- `fetch_logs`
- `policy_sources`

Implementation tasks
- List fetch attempts for a source in reverse chronological order.
- Show requested URL, final URL, HTTP status, content type, response size, success flag, and error message.
- Link log entries back to the source detail and version manager pages.
- Add filtering for success versus failure states if the log volume grows.

Acceptance Criteria
- Editors can inspect fetch history from the source detail area.
- Failed fetches show diagnostic context instead of a generic failure state.
- Successful and failed attempts are visually distinguishable.
- Fetch logs do not require direct database access to review.

Dependencies
- Issue 4.1

Future Notes (optional)
- Add retry actions after basic logging and fetch behavior are stable.

--------------------------------------------------------

### Issue 4.8 — Source Detail UI

Priority:
High

Description:
Build the source detail page that ties together source metadata, fetch actions, version history, and logs so editors can operate on a source from one screen.

Routes (if applicable)
- `/admin/sources/[id]`

Database tables involved
- `policy_sources`
- `fetch_logs`
- `document_versions`
- `policy_changes`

Implementation tasks
- Show source metadata, monitor state, current hash, last fetched date, and registry status.
- Provide action entry points for fetch, manual import, edit, logs, and versions.
- Show recent fetch logs and recent versions inline or as linked sections.
- Surface policy change state when the current source has changed.
- Handle missing source, empty version history, and no-log scenarios gracefully.

Acceptance Criteria
- Editors can manage one source from a dedicated detail page.
- The page links to all major Epic 4 workflows.
- Current hash and latest version state are visible without leaving the page.
- Empty states are explicit for never-fetched and never-versioned sources.

Dependencies
- Issue 3.6
- Issue 4.1
- Issue 4.6
- Issue 4.7

Future Notes (optional)
- Add a side-by-side source text preview later if extraction troubleshooting requires it.

--------------------------------------------------------

## Epic 5 — Section & Clause Processing

### Goal

Transform versioned documents into structured sections and clauses that can be searched, reviewed, and fed into the signal candidate engine.

### Issue 5.1 — Heading Splitter

Priority:
Critical

Description:
Parse document markdown into a hierarchical heading structure so later processing can preserve document organization rather than treating the policy as one flat text blob.

Routes (if applicable)
- `/admin/sources/[id]/versions/[versionId]`

Database tables involved
- `document_versions`
- `sections`

Implementation tasks
- Read `document_versions.markdown_text` as the primary sectioning input.
- Detect headings and heading levels from normalized markdown or fallback text markers.
- Create an intermediate section tree preserving order and parent-child relationships.
- Handle documents with weak or missing headings by falling back to a single root section or simple logical blocks.

Acceptance Criteria
- A version with valid headings produces ordered section records.
- Section parent-child relationships are preserved where headings imply nesting.
- Documents with no reliable headings still produce a usable section structure.
- Section order is deterministic for the same version input.

Dependencies
- Issue 4.3
- Issue 4.6

Future Notes (optional)
- Keep the heading model simple; the MVP does not need deep semantic section labeling.

--------------------------------------------------------

### Issue 5.2 — Section Generator

Priority:
Critical

Description:
Persist the parsed section structure into the database so each document version has explicit section records that downstream tools can reference.

Routes (if applicable)
- `/admin/sources/[id]/versions/[versionId]`

Database tables involved
- `sections`
- `document_versions`

Implementation tasks
- Convert the heading splitter output into `sections` rows tied to the current `document_version_id`.
- Populate `heading`, `section_order`, `section_text`, `anchor`, and `parent_section_id` where available.
- Replace or regenerate section rows safely when the processor is rerun for the same version.
- Ensure sections are inserted in a deterministic order.

Acceptance Criteria
- Each processed document version stores section rows in `sections`.
- Reprocessing the same version does not create duplicate section rows.
- Section text remains tied to the correct document version.
- Anchors or stable identifiers exist when headings allow them.

Dependencies
- Issue 5.1

Future Notes (optional)
- Add richer anchor normalization only if it is needed for public linking later.

--------------------------------------------------------

### Issue 5.3 — Clause Splitter

Priority:
Critical

Description:
Split section text into clause-level units so rule matching and evidence creation can operate on focused, reviewable excerpts instead of full documents.

Routes (if applicable)
- `/admin/sources/[id]/versions/[versionId]`
- `/admin/clauses`

Database tables involved
- `sections`
- `clauses`
- `document_versions`

Implementation tasks
- Segment section text into clause candidates using paragraph boundaries, list items, and sentence-aware fallbacks.
- Insert `clauses` rows tied to both `section_id` and `document_version_id`.
- Preserve clause order within the document.
- Store clause word counts for later filtering and diagnostics.
- Make reprocessing idempotent for a version.

Acceptance Criteria
- Processed document versions produce clause rows that are smaller than the full section text.
- Each clause is associated with the correct section and document version.
- Clause order is stable across reruns on identical content.
- Rerunning the clause splitter does not create duplicate rows for the same version.

Dependencies
- Issue 5.2

Future Notes (optional)
- Keep the first implementation rules-based; do not add AI clause segmentation in the MVP.

--------------------------------------------------------

### Issue 5.4 — Clause Hash

Priority:
High

Description:
Generate stable hashes for individual clauses so later workflows can identify duplicate or unchanged clause text across versions and sources.

Routes (if applicable)
- `/admin/clauses`
- `/admin/clauses/[id]`

Database tables involved
- `clauses`

Implementation tasks
- Normalize clause text consistently before hashing.
- Compute and store `clause_hash` for each inserted clause.
- Ensure hash generation runs as part of clause creation or clause reprocessing.
- Make the hashing deterministic for unchanged clause text.

Acceptance Criteria
- New and reprocessed clauses receive a `clause_hash`.
- Identical clause text produces the same hash across runs.
- Clause hashes are queryable for later duplicate analysis.
- Clause creation does not leave null hashes when text is present.

Dependencies
- Issue 5.3

Future Notes (optional)
- Cross-version clause diffing can build on these hashes later.

--------------------------------------------------------

### Issue 5.5 — Clause Viewer

Priority:
High

Description:
Provide an admin interface for inspecting clauses in context so editors and later review tools can read a clause alongside its section, source, and version metadata.

Routes (if applicable)
- `/admin/clauses`
- `/admin/clauses/[id]`

Database tables involved
- `clauses`
- `sections`
- `document_versions`
- `policy_sources`
- `platforms`

Implementation tasks
- Build a clause list or version-scoped clause view.
- Show clause text, heading context, source title, platform, and version metadata.
- Add navigation from a clause to the parent source, version, and section.
- Expose clause hash and word count for debugging and processing confidence.

Acceptance Criteria
- Editors can open a clause and understand where it came from.
- Clause view shows enough surrounding metadata for manual review.
- Source and version navigation works from clause pages.
- The UI handles versions with large clause counts without rendering all data unbounded.

Dependencies
- Issue 5.3
- Issue 5.4

Future Notes (optional)
- Add inline clause-to-signal links once Epic 6 is implemented.

--------------------------------------------------------

### Issue 5.6 — Search Clauses

Priority:
Medium

Description:
Implement clause search so editors can find specific policy language quickly and verify whether the sectioning and clause pipeline produced usable text.

Routes (if applicable)
- `/admin/clauses`

Database tables involved
- `clauses`
- `sections`
- `document_versions`
- `policy_sources`
- `platforms`

Implementation tasks
- Add text search across `clauses.clause_text`.
- Filter results by platform, source, and document version where practical.
- Return the clause text with platform and source context.
- Link search results to the clause detail page.
- Prefer the existing database text-search index where possible.

Acceptance Criteria
- Editors can search for a phrase and receive matching clauses.
- Search results identify the platform and source for each match.
- Filters reduce result scope correctly.
- Search remains usable on real clause volumes without full-page failure.

Dependencies
- Issue 5.5

Future Notes (optional)
- Highlight matched terms later if search becomes a daily workflow.

--------------------------------------------------------

## Epic 6 — Signal Candidate Engine

### Goal

Run deterministic signal-detection rules against stored clauses so the system can propose reviewable signal candidates before a human approves anything into the public-facing signal layer.

### Issue 6.1 — Rule Manager

Priority:
Critical

Description:
Create the central admin screen for inspecting all signal rules and understanding which categories, keywords, and regex patterns drive candidate generation.

Routes (if applicable)
- `/admin/rules`

Database tables involved
- `signal_rules`

Implementation tasks
- List all signal rules with category, signal name, enabled state, suggested level, and confidence weight.
- Add filtering for category and enabled status.
- Show lightweight summaries of keywords and regex pattern counts.
- Link each rule into create and edit workflows.

Acceptance Criteria
- Editors can browse all signal rules from one page.
- Enabled and disabled rules are visually distinct.
- Rule metadata is visible without opening each rule individually.
- Rule manager provides clear entry points for CRUD actions.

Dependencies
- Issue 0.6
- Issue 5.6

Future Notes (optional)
- Add last-run statistics only after the matcher has been implemented.

--------------------------------------------------------

### Issue 6.2 — Rule CRUD

Priority:
Critical

Description:
Allow editors to create, edit, enable, disable, and delete signal rules within the schema-defined category and level vocabularies.

Routes (if applicable)
- `/admin/rules/new`
- `/admin/rules/[id]`
- `/admin/rules/[id]/edit`

Database tables involved
- `signal_rules`
- `editorial_decision_logs`

Implementation tasks
- Build create and edit forms for rule name, category, signal name, keywords, regex patterns, suggested level, confidence weight, false positive notes, and enabled state.
- Validate category and level values against the schema vocabulary.
- Normalize keyword and regex list input into JSON arrays expected by the table.
- Record meaningful rule changes in `editorial_decision_logs`.
- Decide how deletion behaves when a rule is already referenced by `signal_candidates`; prefer soft-disable over destructive deletion if needed.

Acceptance Criteria
- Editors can create and update valid rules from the UI.
- Invalid category or level values are blocked.
- Enabled and disabled state changes persist correctly.
- Rule changes are audit logged.

Dependencies
- Issue 6.1

Future Notes (optional)
- Prefer disable over delete for rules that have already produced review history.

--------------------------------------------------------

### Issue 6.3 — Rule Matching Engine

Priority:
Critical

Description:
Execute enabled rules against clauses and create reviewable `signal_candidates` rows linked back to the clause, source, platform, and generating rule.

Routes (if applicable)
- `/admin/rules`
- `/admin/signals/candidates`

Database tables involved
- `signal_rules`
- `clauses`
- `policy_sources`
- `platforms`
- `signal_candidates`

Implementation tasks
- Select enabled rules and the target clauses to evaluate.
- Run keyword and regex evaluation for each clause against each eligible rule.
- Create `signal_candidates` rows with suggested signal, category, level, confidence, matched terms, detection method, and source context.
- Prevent duplicate candidate creation for the same clause and rule combination when the engine reruns.
- Scope matching runs so agents can execute them for one version, one source, or one platform instead of the entire database.

Acceptance Criteria
- Running the engine produces `signal_candidates` tied to the correct clause, source, platform, and rule.
- Re-running the same input does not create duplicate candidate rows.
- Disabled rules do not generate candidates.
- Candidate records include matched-term evidence and a detection method.

Dependencies
- Issue 5.4
- Issue 6.2

Future Notes (optional)
- Background processing may be required once clause volume grows.

--------------------------------------------------------

### Issue 6.4 — Keyword Engine

Priority:
High

Description:
Implement the keyword-matching component used by the rule engine so straightforward phrase-based rules can produce transparent, explainable candidate matches.

Routes (if applicable)
- `/admin/rules`
- `/admin/signals/candidates`

Database tables involved
- `signal_rules`
- `clauses`
- `signal_candidates`

Implementation tasks
- Normalize clause text and keyword terms for deterministic matching.
- Support multi-word phrases and case-insensitive matching.
- Capture which keywords matched for storage in `matched_terms`.
- Avoid duplicate matched-term entries for the same rule and clause.
- Expose enough diagnostics to explain why a candidate was created.

Acceptance Criteria
- Keyword-only rules can generate candidates without regex configuration.
- `matched_terms` includes the phrases that triggered the candidate.
- Matching is case-insensitive and deterministic.
- Non-matching clauses do not generate candidate rows.

Dependencies
- Issue 6.3

Future Notes (optional)
- Add stemming or synonym expansion only if rules prove too brittle in practice.

--------------------------------------------------------

### Issue 6.5 — Regex Engine

Priority:
High

Description:
Implement the regex-matching component used by the rule engine for patterns that cannot be captured safely by simple keyword lists.

Routes (if applicable)
- `/admin/rules`
- `/admin/signals/candidates`

Database tables involved
- `signal_rules`
- `clauses`
- `signal_candidates`

Implementation tasks
- Compile and run stored regex patterns safely.
- Handle invalid patterns gracefully during rule save or rule execution.
- Capture matched regex strings or labels in `matched_terms`.
- Ensure regex evaluation respects reasonable performance limits.
- Reuse the same candidate deduplication behavior as the keyword engine.

Acceptance Criteria
- Regex-enabled rules can produce candidates from matching clauses.
- Invalid regex patterns are blocked or surfaced clearly without crashing the run.
- Regex matches are visible in `matched_terms`.
- Regex evaluation does not bypass duplicate-prevention rules.

Dependencies
- Issue 6.2
- Issue 6.3

Future Notes (optional)
- Add regex test fixtures later if pattern complexity increases.

--------------------------------------------------------

### Issue 6.6 — Signal Candidate Queue

Priority:
Critical

Description:
Build the list view for all generated signal candidates so editors can triage pending signal work before approving anything into `signals`.

Routes (if applicable)
- `/admin/signals/candidates`

Database tables involved
- `signal_candidates`
- `platforms`
- `policy_sources`
- `clauses`
- `signal_rules`

Implementation tasks
- Query pending and deeper-review candidates with joined platform, source, clause, and rule context.
- Show suggested signal, category, level, confidence, matched terms, and detection method.
- Order candidates by status, confidence, and creation time.
- Link each row to the detailed review page in Epic 7.
- Support queue pagination or bounded result sets.

Acceptance Criteria
- Editors can see all pending signal candidates in one queue.
- Each row includes enough evidence to prioritize review.
- Queue rows link to a detailed review screen.
- The queue remains usable when candidate volume grows beyond a single page.

Dependencies
- Issue 6.3
- Issue 0.6

Future Notes (optional)
- Add assignee and SLA concepts only if the review workload becomes operationally heavy.

--------------------------------------------------------

### Issue 6.7 — Candidate Filters

Priority:
Medium

Description:
Add filtering and search controls to the signal candidate queue so reviewers can focus on one platform, one category, or one confidence band at a time.

Routes (if applicable)
- `/admin/signals/candidates`

Database tables involved
- `signal_candidates`
- `platforms`
- `policy_sources`

Implementation tasks
- Add filters for platform, status, suggested category, suggested level, detection method, and rule.
- Add text search across suggested signal names and clause excerpts where practical.
- Preserve filter state in the URL so views are shareable and repeatable.
- Reset pagination correctly when filters change.

Acceptance Criteria
- Reviewers can reduce the queue to one platform or one category quickly.
- Filter state survives refresh and is reflected in the URL.
- Combined filters return the expected subset of candidates.
- Default queue behavior remains sensible when no filters are active.

Dependencies
- Issue 6.6

Future Notes (optional)
- Add saved reviewer presets later if queue complexity increases.

--------------------------------------------------------

## Epic 7 — Review Workbench & Evidence Builder

### Goal

Give editors the tools to review signal candidates, approve or reject them, build evidence safely, and preserve internal context before any public-facing signal is considered complete.

### Issue 7.1 — Review Queue

Priority:
Critical

Description:
Create the review workbench landing page where editors can work through pending signal candidates and understand the current review backlog.

Routes (if applicable)
- `/admin/review`
- `/admin/review/signals`

Database tables involved
- `signal_candidates`
- `editorial_tasks`
- `platforms`

Implementation tasks
- Build a review-focused queue using pending `signal_candidates`.
- Show queue counts by status and platform.
- Surface related `editorial_tasks` where they exist.
- Link queue items into the candidate detail workflow.
- Distinguish unreviewed items from deeper-review items.

Acceptance Criteria
- Editors can open one review page and see what needs decision work.
- Queue counts match the current candidate states.
- Review items link cleanly into detail pages.
- Queue state is understandable without reading raw database fields.

Dependencies
- Issue 6.6
- Issue 6.7

Future Notes (optional)
- Add reviewer assignment later if multiple editors work the queue concurrently.

--------------------------------------------------------

### Issue 7.2 — Candidate Detail

Priority:
Critical

Description:
Build the detailed review page for a single signal candidate, including source context, clause text, rule match information, and nearby metadata needed for an approval decision.

Routes (if applicable)
- `/admin/review/signals/[id]`

Database tables involved
- `signal_candidates`
- `clauses`
- `sections`
- `document_versions`
- `policy_sources`
- `platforms`
- `signal_rules`

Implementation tasks
- Load the full candidate record with joined clause, section, source, version, platform, and rule context.
- Show the exact clause text and heading context that produced the candidate.
- Show matched terms, suggested signal, category, level, confidence, and detection method.
- Provide quick links back to the source, version, clause, and rule pages.
- Reserve space for approve, reject, and evidence-building actions.

Acceptance Criteria
- Reviewers can understand why the candidate exists from one screen.
- Clause and source context are visible without opening multiple tabs.
- The detail page exposes all fields needed for approval or rejection.
- Not-found and already-reviewed candidate states are handled explicitly.

Dependencies
- Issue 6.6
- Issue 5.5

Future Notes (optional)
- Add adjacent-clause context later if reviewers need more surrounding text.

--------------------------------------------------------

### Issue 7.3 — Approve Signal

Priority:
Critical

Description:
Approve a signal candidate into the canonical `signals` table so reviewed policy findings can move from suggestion to curated internal record.

Routes (if applicable)
- `/admin/review/signals/[id]`
- `/admin/signals/[id]`

Database tables involved
- `signal_candidates`
- `signals`
- `editorial_tasks`
- `editorial_decision_logs`

Implementation tasks
- Allow the reviewer to confirm or edit the signal name, category, level, confidence, explanation, and internal reason.
- Create a `signals` row tied to the platform.
- Update the candidate status to `approved` and stamp reviewer fields.
- Create or update the related `editorial_tasks` row for evidence follow-up if required.
- Record the approval action in `editorial_decision_logs`.

Acceptance Criteria
- Approving a candidate creates one `signals` row.
- The originating candidate status becomes `approved`.
- Signal data reflects reviewer edits rather than only the suggested defaults.
- Approval creates a clear audit trail.

Dependencies
- Issue 7.2

Future Notes (optional)
- Consider duplicate-signal merging later if multiple candidates map to the same final signal.

--------------------------------------------------------

### Issue 7.4 — Reject Signal

Priority:
High

Description:
Reject a signal candidate when the rule match is not editorially valid, while preserving the reason and preventing accidental approval later.

Routes (if applicable)
- `/admin/review/signals/[id]`

Database tables involved
- `signal_candidates`
- `editorial_tasks`
- `editorial_decision_logs`

Implementation tasks
- Add a rejection action with a required reviewer reason.
- Update candidate status to `rejected` and stamp reviewer fields.
- Close or update any related editorial task.
- Record the rejection action and rationale in `editorial_decision_logs`.
- Remove rejected items from the default pending queue while keeping them reviewable through filters.

Acceptance Criteria
- Reviewers can reject a candidate from the detail page.
- Rejected candidates do not create `signals` rows.
- Rejection reason, reviewer, and timestamp are preserved.
- Rejected items remain searchable for audit purposes.

Dependencies
- Issue 7.2

Future Notes (optional)
- Add structured rejection taxonomies only if the team starts analyzing false-positive patterns.

--------------------------------------------------------

### Issue 7.5 — Evidence Builder

Priority:
Critical

Description:
Provide the workflow for turning an approved signal into one or more evidence items grounded in specific clauses and source versions.

Routes (if applicable)
- `/admin/signals/[id]/evidence/new`
- `/admin/signals/[id]`

Database tables involved
- `signals`
- `evidence_items`
- `clauses`
- `policy_sources`
- `document_versions`

Implementation tasks
- Build an evidence creation form tied to an approved signal.
- Pre-fill source URL, document title, clause excerpt, and review date from the chosen clause and source context where possible.
- Require editor-authored explanation text and optional `why_it_matters`.
- Allow visibility and status selection within the schema vocabulary.
- Permit multiple evidence items per signal.
- Return the reviewer to the signal detail page after save.

Acceptance Criteria
- Reviewers can create an `evidence_items` row from an approved signal.
- Evidence records retain clause, source, and version references when available.
- Required narrative fields cannot be left blank.
- Saved evidence is visible from the signal detail page immediately.

Dependencies
- Issue 7.3
- Issue 7.2

Future Notes (optional)
- Add clone-from-existing-evidence later if multiple signals cite similar clauses.

--------------------------------------------------------

### Issue 7.6 — Safe Wording Checker

Priority:
Medium

Description:
Introduce a review helper that checks evidence wording for unsafe absolutes, unsupported claims, or editorial phrasing that should be revised before publication.

Routes (if applicable)
- `/admin/signals/[id]/evidence/new`
- `/admin/signals/[id]/evidence/[evidenceId]/edit`

Database tables involved
- `evidence_items`
- `signals`

Implementation tasks
- Define a deterministic set of wording checks for absolute or over-claiming language.
- Run the checks against `explanation` and `why_it_matters` before save or preview.
- Surface warnings without blocking draft save unless the wording violates a hard rule defined by the team.
- Let reviewers revise text and rerun the checker quickly.

Acceptance Criteria
- Evidence drafting surfaces wording warnings when risky phrasing is present.
- Safe wording checks do not invent new database fields.
- Reviewers can still edit and resave drafts after warnings appear.
- The checker behavior is deterministic and explainable.

Dependencies
- Issue 7.5

Future Notes (optional)
- Keep this rules-based for MVP; do not introduce opaque AI rewriting behavior.

--------------------------------------------------------

### Issue 7.7 — Evidence Preview

Priority:
High

Description:
Show reviewers how an evidence item will read before it is finalized so they can verify formatting, source attribution, and explanatory clarity.

Routes (if applicable)
- `/admin/signals/[id]/evidence/preview`
- `/admin/signals/[id]`

Database tables involved
- `evidence_items`
- `signals`
- `policy_sources`
- `document_versions`

Implementation tasks
- Render a preview of the evidence title context, clause excerpt, source attribution, review date, explanation, and why-it-matters copy.
- Make draft evidence previewable before approval or publication.
- Ensure preview output uses the same source and clause references stored in the database.
- Link back to edit mode for quick revision.

Acceptance Criteria
- Reviewers can preview draft evidence before finalizing it.
- Preview content matches the saved database fields.
- Source attribution and clause excerpt are clearly visible in the preview.
- Reviewers can return to editing without losing draft content.

Dependencies
- Issue 7.5
- Issue 7.6

Future Notes (optional)
- Public-facing evidence rendering can reuse this structure later.

--------------------------------------------------------

### Issue 7.8 — Internal Notes

Priority:
Medium

Description:
Provide a consistent place for reviewer-only context during signal and evidence work using the internal fields already present in the schema.

Routes (if applicable)
- `/admin/review/signals/[id]`
- `/admin/signals/[id]`

Database tables involved
- `signals`
- `editorial_tasks`
- `editorial_decision_logs`

Implementation tasks
- Expose `signals.internal_reason` during signal approval and later edits.
- Surface related `editorial_tasks.internal_notes` where review work is tied to a task.
- Write reviewer rationale into `editorial_decision_logs.reason` for major approve or reject actions.
- Ensure internal notes are never rendered in evidence preview or any later public-facing output.

Acceptance Criteria
- Reviewers have a clear place to store internal-only rationale during approval work.
- Internal notes remain separate from public evidence content.
- Signal detail and review pages display relevant internal context consistently.
- Approve and reject actions preserve reviewer rationale in the audit trail.

Dependencies
- Issue 7.3
- Issue 7.4
- Issue 7.5

Future Notes (optional)
- Add a dedicated candidate-notes field only if the existing internal fields prove insufficient.

--------------------------------------------------------

