# Release File Manifest

Generated for the production hardening debug pass on 2026-07-15.

## Files included in release

Reason: production hardening changes or required dependencies for the hardening release.

- `.env.example`
- `SETUP.md`
- `TESTING.md`
- `docs/DATABASE_MIGRATION_OPERATIONS.md`
- `docs/PUBLISH_GATE_GAP_REPORT.md`
- `docs/PRODUCTION_HARDENING_SPRINT.md`
- `docs/RC1_CHECKLIST.md`
- `docs/RELEASE_FILE_MANIFEST.md`
- `next.config.ts`
- `package-lock.json`
- `package.json`
- `proxy.ts`
- `schema.polibrawl.sql`
- `scripts/apply-additive-schema.mjs`
- `scripts/apply-clean-schema.mjs`
- `scripts/apply-polibrawl-schema.mjs`
- `scripts/apply-schema.mjs`
- `scripts/check-polibrawl-db-health.mjs`
- `scripts/lib/polibrawl-db.mjs`
- `scripts/sql/add-production-hardening-v1.sql`
- `scripts/verify-polibrawl-migration-readiness.mjs`
- `src/app/admin/layout.tsx`
- `src/app/api/discovery/runs/route.ts`
- `src/app/api/platforms/[id]/route.ts`
- `src/app/api/platforms/route.ts`
- `src/app/api/rules/[id]/route.ts`
- `src/app/api/rules/route.ts`
- `src/app/api/signal-candidates/[id]/approve/route.ts`
- `src/app/api/signal-candidates/[id]/reject/route.ts`
- `src/app/api/signals/[id]/evidence/route.ts`
- `src/app/api/signals/run/route.ts`
- `src/app/api/source-candidates/[id]/approve/route.ts`
- `src/app/api/source-candidates/[id]/preview-classify/route.ts`
- `src/app/api/source-candidates/[id]/reject/route.ts`
- `src/app/api/sources/[id]/fetch/route.ts`
- `src/app/api/sources/[id]/import/route.ts`
- `src/app/api/sources/[id]/process/route.ts`
- `src/app/api/sources/[id]/reclassify/route.ts`
- `src/app/api/sources/[id]/route.ts`
- `src/app/api/sources/route.ts`
- `src/app/platforms/[slug]/page.tsx`
- `src/app/red-flags/[id]/page.tsx`
- `src/components/public/ui/copy-sanitizer.ts`
- `src/components/public/ui/playbook-components.tsx`
- `src/components/public/ui/risk-badge.tsx`
- `src/components/public/ui/retention-components.tsx`
- `src/features/backup-options/schemas/backup-option.schema.ts`
- `src/features/community/schemas/community.schema.ts`
- `src/features/evidence/schemas/evidence.schema.ts`
- `src/features/platform-intelligence/actions/intelligence.actions.ts`
- `src/features/platform-intelligence/schemas/intelligence.schema.ts`
- `src/features/platforms/actions/platform.actions.ts`
- `src/features/platforms/schemas/platform.schema.ts`
- `src/features/shared/schemas/helpers.ts`
- `src/features/shared/schemas/http-url.ts`
- `src/features/sources/schemas/source.schema.ts`
- `src/features/survival-pages/actions/survival-page.actions.ts`
- `src/instrumentation.ts`
- `src/lib/auth-policy.ts`
- `src/lib/auth.ts`
- `src/lib/env.ts`
- `src/lib/validation/evidence.ts`
- `src/lib/validation/platform.ts`
- `src/lib/validation/source.ts`
- `src/server/polibrawl/db.ts`
- `src/server/polibrawl/schema-health.shared.ts`
- `src/server/polibrawl/services/editorial/editorial-quality-validator.ts`
- `src/server/polibrawl/services/platform-publication-readiness.service.ts`
- `src/server/polibrawl/services/platform-publication-readiness.shared.ts`
- `src/server/polibrawl/services/public-delivery.service.ts`
- `src/server/polibrawl/services/public-view-models.shared.ts`
- `src/server/polibrawl/services/red-flag-quality.service.ts`
- `src/server/polibrawl/services/survival-page-composer.service.ts`
- `tests/production-hardening/auth-policy.test.ts`
- `tests/production-hardening/db-constraints.test.ts`
- `tests/production-hardening/editorial-quality.test.ts`
- `tests/production-hardening/http-url.test.ts`
- `tests/production-hardening/platform-publication-readiness.test.ts`
- `tests/production-hardening/public-view-models.test.ts`
- `tests/production-hardening/schema-health.test.ts`

## Files excluded

Reason: unrelated product work, community/member workflow work, or point-in-time artifacts that do not belong in the hardening release commit.

- `docs/PRODUCT_SHELL_SPRINT_1.md`
- `docs/PRODUCTION_RELEASE_REPORT.md`
- `src/app/contribute/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/my-stack/page.tsx`
- `src/app/page.tsx`
- `src/app/platforms/page.tsx`
- `src/components/public/layout.tsx`
- `src/components/public/ui/community-forms.tsx`
- `src/components/public/ui/components.tsx`
- `src/features/community/actions/community.actions.ts`

## Notes

- The included list is the intended hardening release boundary.
- The excluded list is still present in the local worktree and must stay out of the release commit.
- `src/app/platforms/[slug]/page.tsx`, `src/app/red-flags/[id]/page.tsx`, `src/components/public/ui/playbook-components.tsx`, and `src/components/public/ui/risk-badge.tsx` are required together because the public leak fix and copy-rejection behavior depend on them compiling as a set.
- `src/components/public/ui/retention-components.tsx` is included only for the one-line lint blocker fix needed to keep the repository releasable. The unrelated stack-profile work from this file remains preserved in stash and out of the release commit.
- Do not stage the excluded files when preparing `fix(production): harden intelligence release path`.
