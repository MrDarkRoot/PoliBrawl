# Sprint 11 Release Manifest

## Release Boundary

This release contains only Sprint 11 Payment Dependency Decision MVP files and the shared schema/health/page integration required to make that MVP run safely.

The clean release worktree is:

`/home/vanta/Projects/PlatFormPoc-sprint11-release`

The original repository worktree contained unrelated Sprint 10.6 telemetry and QA artifacts. Those files are excluded from this release and must not be staged with Sprint 11.

## Category A — Sprint 11 Payment Decision MVP

- `docs/PAYMENT_DECISION_CONTENT_OPERATIONS.md`
- `docs/PAYMENT_DECISION_MVP_VALIDATION_PLAN.md`
- `docs/PAYMENT_DECISION_RULE_DICTIONARY.md`
- `docs/PAYMENT_DEPENDENCY_DECISION_MVP.md`
- `docs/SPRINT_11_MIGRATION_REVIEW.md`
- `docs/SPRINT_11_RELEASE_MANIFEST.md`
- `docs/SPRINT_11_SCENARIO_VALIDATION.md`
- `scripts/sql/add-payment-dependency-decision-mvp-v1.sql`
- `src/app/payment-check/`
- `src/features/payment-decision/`
- `tests/production-hardening/payment-decision-engine.test.ts`

## Category B — Required Sprint 11 Dependencies

- `docs/DATABASE_MIGRATION_OPERATIONS.md`
- `schema.polibrawl.sql`
- `scripts/lib/polibrawl-db.mjs`
- `scripts/sql/repair-policy-intelligence-retention-columns-v1.sql`
- `scripts/verify-polibrawl-migration-readiness.mjs`
- `src/app/page.tsx`
- `src/app/search/page.tsx`
- `src/components/public/layout.tsx`
- `src/server/polibrawl/schema-health.shared.ts`
- `tests/production-hardening/schema-health.test.ts`

## Category C — Excluded Unrelated Work

- `docs/EDITORIAL_OPERATIONS_TELEMETRY.md`
- `docs/SPRINT_10_6_TELEMETRY_VERIFICATION.md`
- `scripts/sql/add-editorial-operations-telemetry-v1.sql`
- `scripts/sql/complete-editorial-operations-telemetry-v1.sql`
- `src/app/admin/editorial-operations/`
- `src/features/editorial-operations/`
- unrelated editorial telemetry service/test/type changes

## Category D — Excluded Temporary QA Artifacts

- `create_qa_user.sql`
- `qa_fixture.sql`
- `inspect-prod.mjs`
- `login_error.png`
- `login_page.html`
- `scripts/test-login.mjs`
- `test-output.json`
- browser screenshots or local QA exports

## Category E — Secrets Or Prohibited Files

- `.env`
- `.env.local`
- `.env.production.local`
- `.env.vercel.prod`
- `.vercel/`
- `supabase/.temp/`
- `.next/`
- `node_modules/`
- database credentials
- browser session files
- generated production reports

## Staging Rule

Use selective staging only. Do not use `git add .`.
