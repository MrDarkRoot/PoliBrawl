-- Sprint 11 — Payment Dependency Decision MVP
-- Additive persistence for shareable, non-sensitive payment decision reports.

create table if not exists payment_decision_sessions (
  id uuid primary key default gen_random_uuid(),
  report_token text not null unique,
  country text not null check (
    country in ('vietnam', 'country_verification_required')
  ),
  work_type text not null check (
    work_type in ('bug_bounty', 'freelancer', 'creator', 'consultant', 'indie_hacker', 'other')
  ),
  platform_id uuid not null references platforms(id) on delete restrict,
  comparison_platform_id uuid references platforms(id) on delete restrict,
  amount_range text not null check (
    amount_range in ('under_500', '500_to_5000', 'over_5000')
  ),
  payment_frequency text not null check (
    payment_frequency in ('one_time', 'irregular', 'regular')
  ),
  usage_role text not null check (
    usage_role in ('primary', 'backup', 'evaluating')
  ),
  has_backup_route boolean not null,
  concerns jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  constraint payment_decision_report_token_entropy_check
    check (length(report_token) >= 43),
  constraint payment_decision_sessions_concerns_array_check
    check (jsonb_typeof(concerns) = 'array')
);

create index if not exists idx_payment_decision_sessions_platform_id
  on payment_decision_sessions (platform_id, created_at desc);

create index if not exists idx_payment_decision_sessions_created_at
  on payment_decision_sessions (created_at desc);

create index if not exists idx_payment_decision_sessions_expires_at
  on payment_decision_sessions (expires_at)
  where expires_at is not null;

create table if not exists payment_decision_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references payment_decision_sessions(id) on delete cascade,
  recommendation_code text not null check (
    recommendation_code in (
      'SUITABLE_AS_SECONDARY_METHOD',
      'USE_WITH_VERIFIED_BACKUP',
      'AVOID_SINGLE_PLATFORM_DEPENDENCY',
      'COMPLETE_VERIFICATION_BEFORE_LARGE_PAYMENT',
      'MINIMIZE_STORED_BALANCE',
      'VERIFY_COUNTRY_ELIGIBILITY',
      'VERIFY_PAYER_COMPATIBILITY',
      'FURTHER_REVIEW_REQUIRED'
    )
  ),
  matched_rule_keys jsonb not null default '[]'::jsonb,
  matched_risk_ids jsonb not null default '[]'::jsonb,
  matched_evidence_ids jsonb not null default '[]'::jsonb,
  action_codes jsonb not null default '[]'::jsonb,
  confidence_level text not null check (
    confidence_level in ('low', 'moderate', 'high')
  ),
  confidence_reasons jsonb not null default '[]'::jsonb,
  limitations jsonb not null default '[]'::jsonb,
  result_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  constraint payment_decision_results_rule_keys_array_check
    check (jsonb_typeof(matched_rule_keys) = 'array'),
  constraint payment_decision_results_risk_ids_array_check
    check (jsonb_typeof(matched_risk_ids) = 'array'),
  constraint payment_decision_results_evidence_ids_array_check
    check (jsonb_typeof(matched_evidence_ids) = 'array'),
  constraint payment_decision_results_action_codes_array_check
    check (jsonb_typeof(action_codes) = 'array'),
  constraint payment_decision_results_confidence_reasons_array_check
    check (jsonb_typeof(confidence_reasons) = 'array'),
  constraint payment_decision_results_limitations_array_check
    check (jsonb_typeof(limitations) = 'array'),
  constraint payment_decision_results_snapshot_object_check
    check (jsonb_typeof(result_snapshot) = 'object')
);

create index if not exists idx_payment_decision_results_session_id
  on payment_decision_results (session_id, created_at desc);

create index if not exists idx_payment_decision_results_recommendation_code
  on payment_decision_results (recommendation_code, created_at desc);

create index if not exists idx_payment_decision_results_confidence_level
  on payment_decision_results (confidence_level, created_at desc);
