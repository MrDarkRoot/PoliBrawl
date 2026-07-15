# Publish Gate Gap Report

Generated during the production hardening debug pass on 2026-07-15.

## Summary

Current production content is not ready for the stricter hardening-era publication gate.

Two independent blockers exist:

1. The live production schema is missing the intelligence tables expected by the hardening build.
2. Existing published platform content contains editorial and checklist gaps that would fail readiness checks.

## Shared production blockers

### Missing live schema

Production is currently missing these required tables:

- `resolution_routes`
- `dependency_scores`
- `risk_timelines`
- `evidence_confidence`

Required action:

- Apply the canonical schema workflow before any hardening deployment.
- Re-run `npm run db:verify-migrations` and `npm run db:health` against the production database target.

## Platform gaps

### PayPal

Missing:

- One published red flag still lacks a published checklist.
- The same red flag lacks published checklist items.
- Current production HTML was previously observed leaking `source_snapshot_id`.

Required action:

- Add a published checklist and at least one published checklist item for the affected published red flag.
- Rebuild public output with the leak fix included in this debug pass.
- Re-run the publication readiness validator before deployment.

### Stripe

Missing:

- Platform summary copy is still generic placeholder-grade content.
- At least one attached published red flag summary uses placeholder-style editorial language that the hardening validator rejects.

Observed examples:

- `Official survival overview and red flags for Stripe users.`
- `Analysis of Stripe's terms reveals critical control regarding ...`

Required action:

- Replace placeholder platform summary copy with platform-specific operational guidance.
- Replace generic red flag summary copy with supported editorial text tied to official evidence.
- Re-run the publication readiness validator after copy replacement.

## Release implication

If the hardening build is deployed before these gaps are resolved:

- the app may fail startup or route health checks because production schema is incomplete
- PayPal and Stripe may fail public readiness and disappear from the public site
- the source snapshot leak fix will not reach production because the current production build predates the hardening work
