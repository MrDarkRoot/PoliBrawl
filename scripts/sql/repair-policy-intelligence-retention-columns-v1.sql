-- Additive repair for missing policy_changes columns required by the migration readiness gate.

alter table if exists policy_changes add column if not exists created_at timestamptz not null default now();
alter table if exists policy_changes add column if not exists reviewed_at timestamptz;
