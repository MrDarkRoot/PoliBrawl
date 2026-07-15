# Production Hardening Sprint

## Scope

This sprint hardens PoliBrawl for production reliability, security, and editorial integrity. It does not add new product features.

## Problems Addressed

### P0

- Database rollout could leave production missing intelligence tables
- Admin authentication could fail open when auth configuration was missing

### P1

- Public URL validation accepted unsafe schemes
- Platforms could publish with incomplete intelligence and editorial coverage
- Public rendering masked bad editorial copy instead of rejecting it

### P2

- Multiple published dependency score records could exist for one platform
- Multiple published evidence confidence records could exist for one platform

## Fixes Shipped

### Migration reliability

- Added canonical schema apply flow through `npm run db:apply-schema`
- Added tracked additive migration journal `polibrawl_schema_migrations`
- Added database health check command `npm run db:health`
- Added startup table verification through `src/instrumentation.ts`

### Authentication hardening

- Admin access now denies on missing auth environment
- Admin access now denies on missing session
- Admin access now denies on missing `profiles` row
- Admin access now denies on non-admin role
- `/admin` and `/api` now return `403` when auth configuration is incomplete

### Public safety and editorial integrity

- Replaced permissive URL validation with explicit `http`/`https` validation
- Added platform publication readiness validation before publish
- Added editorial quality validation for public-facing copy
- Removed public copy masking that previously hid bad editorial content
- Public platform and red-flag delivery now fail closed when the platform is not publication-ready

### Database integrity

- Added partial unique indexes for published `dependency_scores`
- Added partial unique indexes for published `evidence_confidence`

## Validation Results

- `npm run lint` passed
- `npm run typecheck` passed
- `npm run build` passed
- `npm run test:hardening` passed
- `npm run db:health` passed

## Runtime Review

Production-mode smoke checks were run from `npm start -- --port 3001`.

- `/admin/platforms/9281495f-95d1-449e-8f4c-ed6e35679b25/intelligence` returned `403` when unauthenticated
- `/platforms/paypal` returned `404`
- `/platforms/stripe` returned `404`

The public `404` results are expected in the current local dataset because the stricter publication gate now hides platforms that are not fully publication-ready.

## Remaining Risks

- Existing local content may no longer qualify for publication until editorial records are completed and published
- Admin profile provisioning is manual; operators must ensure `profiles.role` is set before expecting admin access
- Lint still reports unrelated warnings in pre-existing non-hardening files, although the lint command exits successfully
