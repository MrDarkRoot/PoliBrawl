# Platform Survival Intelligence v1

## Product rationale

PoliBrawl is evolving from a policy documentation site into a platform survival intelligence product.

The gap in the previous public experience was straightforward:

- users could see that a risk existed
- users could read evidence and survival notes
- users still had to guess what would happen operationally, how dependent they were, and where escalation might start

Platform Survival Intelligence v1 closes that gap with four platform-level intelligence entities:

1. `resolution_routes`
2. `dependency_scores`
3. `risk_timelines`
4. `evidence_confidence`

These entities sit above individual red flags and turn the platform page into an operating surface rather than a static article.

## Architecture

### Data flow

Official source material still flows through the existing PoliBrawl pipeline:

Official sources -> acquisition -> snapshots -> scanner -> research packets -> editorial review -> survival page

The new intelligence layer is additive and platform-scoped:

- red flags remain the core evidence-backed editorial findings
- survival pages still compose red flags into the public guide
- intelligence records add platform-level dependency, escalation, timeline, and confidence context

### Runtime placement

- Schema: [schema.polibrawl.sql](/home/vanta/Projects/PlatFormPoc/schema.polibrawl.sql)
- Additive migration: [scripts/sql/add-platform-survival-intelligence-v1.sql](/home/vanta/Projects/PlatFormPoc/scripts/sql/add-platform-survival-intelligence-v1.sql)
- Repositories: `src/server/polibrawl/repositories/*`
- Public delivery queries: [src/server/polibrawl/services/public-delivery.service.ts](/home/vanta/Projects/PlatFormPoc/src/server/polibrawl/services/public-delivery.service.ts)
- Admin editor: [src/app/admin/platforms/[id]/intelligence/page.tsx](/home/vanta/Projects/PlatFormPoc/src/app/admin/platforms/[id]/intelligence/page.tsx)
- Public page: [src/app/platforms/[slug]/page.tsx](/home/vanta/Projects/PlatFormPoc/src/app/platforms/[slug]/page.tsx)

### Visibility model

All new intelligence records use explicit publish state:

- `draft`
- `published`
- `archived`

Public routes only read `published` rows.

## Schema

### `resolution_routes`

Purpose: official internal or external escalation routes that may be available after a user completes the immediate checklist.

Fields:

- `platform_id`
- `organization_name`
- `organization_type`
- `country`
- `jurisdiction`
- `official_url`
- `eligible_users`
- `eligible_disputes`
- `requirements`
- `steps`
- `fees`
- `limits`
- `deadline`
- `verification_source`
- `last_verified_at`
- `status`
- `display_order`

### `dependency_scores`

Purpose: a clearly labeled PoliBrawl operational dependency estimate.

Fields:

- `platform_id`
- `score` (`0-100`)
- `risk_level`
- `factors`
- `explanation`
- `generated_at`
- `status`

Notes:

- this is editorial estimation, not objective truth
- public UI must keep that wording visible

### `risk_timelines`

Purpose: verified, platform-level operational timelines that translate policy language into a plausible sequence.

Fields:

- `platform_id`
- `title`
- `events` (structured `{ label, detail }[]`)
- `source`
- `status`
- `display_order`

Notes:

- exact timing must never be invented
- the public UI explicitly reminds readers that timing varies by account circumstances

### `evidence_confidence`

Purpose: public trust signal about freshness and source quality without exposing scanner internals.

Fields:

- `platform_id`
- `score`
- `factors`
- `last_verified_at`
- `status`

Notes:

- public label is `Confidence level`
- public UI must not expose internal confidence or scanner metadata

## Editorial rules

This intelligence layer follows the same Layer A editorial rules as the rest of PoliBrawl:

- use official evidence and platform-owned sources
- separate facts from operational recommendations
- never accuse a platform of wrongdoing without direct legal or regulatory basis
- never promise refunds, reinstatement, or recovery
- never phrase escalation routes as guaranteed outcomes
- label dependency scoring as an estimate
- avoid internal language like scanner, packet, candidate, or noise score
- keep community stories and emotional content outside the core intelligence sections

## Public UX rules

The intended platform page order is now:

1. Hero
2. Risk Summary
3. Why Users Get Caught
4. Dependency Snapshot
5. What Happens If
6. Survival Playbook
7. What To Do Today
8. Where To Escalate
9. Backup Options
10. Official Evidence
11. Disclaimer

Community contribution prompts remain below the serious editorial layer.

## Admin workflow

v1 uses a minimal admin/editor model:

- platform-scoped editor at `/admin/platforms/[id]/intelligence`
- direct forms for create/update
- separate archive actions
- no large standalone dashboard

This follows the current repository and server-action pattern already used in PoliBrawl admin.

## Future roadmap

### Likely next sprint

1. publish/readiness checks for platform intelligence records
2. timeline attachment to specific red-flag scenarios where needed
3. route-level document attachments for escalation evidence
4. smarter dependency recommendation generation based on platform category and failure mode
5. public filters and comparison views built on dependency score and confidence data

### Deliberately not in v1

- legal outcome prediction
- automated regulator matching beyond editor-entered routes
- user-specific scoring from private business data
- AI-generated escalation claims without official support
