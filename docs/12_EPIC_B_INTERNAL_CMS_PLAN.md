# Epic B Internal CMS Plan

This document is the implementation handoff for the next Codex build task.

Epic B should build the internal CMS for the Red Flag Survival MVP without expanding the old legal-document product model and without building the public site yet.

*Note: Epic B implementation is complete through Sprint 6.5. Sprint 7 must treat Epic B schema as a stable contract.*

## Prerequisites

Before Epic B coding, read the technical skeleton docs:
- `ARCHITECTURE.md`
- `PROJECT_STRUCTURE.md`
- `DESIGN_SYSTEM.md`
- `NAVIGATION.md`
- `STATE_MACHINE.md`
- `NAMING_CONVENTION.md`
- `docs/adr/`

## Ground Rules

- Do not delete old code during the first Epic B pass.
- Prefer additive changes and safe archival labels.
- Keep `/admin` as the internal surface.
- Build for one founder operator, not a multi-team enterprise workflow.
- Treat legacy `schema.sql` and old domain types as reference material until the new model is stable.

## B1 — Archive old domain schema/code references safely

Likely files touched:
- `README.md`
- `docs/`
- `schema.sql`
- `src/lib/routes.ts`
- `src/lib/constants.ts`
- `src/types/domain.ts`
- `src/types/database.ts`
- legacy admin pages under `src/app/admin/clauses`, `src/app/admin/discovery`, `src/app/admin/rules`, `src/app/admin/signals`

Acceptance criteria:
- legacy legal-document concepts are clearly labeled as legacy in code comments, docs, or navigation where needed
- active build path for Epic B is centered on platforms, sources, red flags, evidence, survival notes, backup options, and checklists
- no runtime breakage from removing still-used imports or routes

What not to do:
- do not delete old routes or tables yet
- do not rewrite the old schema in place during this phase
- do not ship a mixed UI that still speaks primarily in clauses/rules/signals

## B2 — Create `schema.polibrawl.sql`

Likely files touched:
- `schema.polibrawl.sql`
- `docs/04_DATA_MODEL.md`
- `docs/12_EPIC_B_INTERNAL_CMS_PLAN.md`

Acceptance criteria:
- a new SQL schema file exists for the PoliBrawl MVP model
- tables map to the entities in `docs/04_DATA_MODEL.md`
- publish-state and moderation-state fields are explicit
- no migration is applied automatically yet unless explicitly requested

What not to do:
- do not overwrite `schema.sql`
- do not drop legacy tables
- do not add non-MVP tables

## B3 — Create TypeScript domain types

Likely files touched:
- `src/types/`
- `src/types/domain.ts`
- new files such as `src/types/polibrawl.ts` or `src/types/cms.ts`

Acceptance criteria:
- new domain types exist for the MVP entities
- types use product language from the docs rather than legacy clause/signal language
- shared enums and statuses are centralized

What not to do:
- do not force the old generated database types to become the new canonical model immediately
- do not leave mixed legacy and new naming unresolved in the same type surface without aliases or comments

## B4 — Create repository layer

Likely files touched:
- `src/server/repositories/`
- possible new repositories for platforms, sources, red flags, evidence, survival notes, backup options, checklists, and submissions
- `src/lib/validation/`

Acceptance criteria:
- CRUD and list operations exist for each core CMS entity
- repository methods align to the new schema and validation flow
- public/private query separation is explicit

What not to do:
- do not bury business logic inside route handlers
- do not couple repository outputs directly to legacy page DTOs if the shapes no longer fit

## B5 — Create admin layout routes

Likely files touched:
- `src/app/admin/layout.tsx`
- `src/app/admin/page.tsx`
- `src/lib/routes.ts`
- new or repurposed admin route folders under `src/app/admin/`

Acceptance criteria:
- admin navigation reflects the Epic B CMS modules
- founder can navigate to platforms, sources, candidates, red flags, evidence, notes, backup options, checklists, submissions, and publisher preview
- legacy navigation items are either hidden, relabeled as legacy, or clearly separated

What not to do:
- do not build public routes yet
- do not keep legacy navigation as the dominant experience

## B6 — Platform Registry CRUD

Likely files touched:
- `src/app/admin/platforms/`
- `src/app/api/platforms/`
- `src/server/repositories/platform-repository.ts`
- `src/lib/validation/platform.ts`

Acceptance criteria:
- admin can create, edit, list, and archive platforms
- slug, category, and basic metadata validation exist
- platform detail page acts as a control center for related work

What not to do:
- do not add public platform pages yet
- do not add third-party enrichment integrations

## B7 — Source Registry CRUD

Likely files touched:
- `src/app/admin/sources/`
- `src/app/api/sources/`
- `src/server/repositories/source-repository.ts`
- `src/lib/validation/source.ts`

Acceptance criteria:
- admin can register manual and URL-backed sources per platform
- source status, type, URL, and capture metadata are editable
- duplicate source handling is reasonable for MVP

What not to do:
- do not build a crawler
- do not support authenticated scraping

## B8 — Fetch/Paste Text

Likely files touched:
- `src/app/admin/sources/[id]/import/page.tsx`
- `src/app/api/sources/[id]/fetch/route.ts`
- `src/app/api/sources/[id]/import/route.ts`
- `src/server/services/fetch/fetcher.ts`
- `src/server/services/extraction/`

Acceptance criteria:
- admin can fetch a safe public URL or paste source text manually
- raw capture is stored privately
- fetcher applies SSRF protections, timeout, redirect, and size limits

What not to do:
- do not fetch private or authenticated pages
- do not add browser automation

## B9 — Keyword Scanner

Likely files touched:
- `src/lib/constants.ts`
- new scanner service files under `src/server/services/`
- candidate-related API routes under `src/app/api/`

Acceptance criteria:
- scanner reads captured source text
- scanner emits `red_flag_candidates` with matched keywords, excerpt context, and category
- scanner taxonomy follows `docs/06_PIPELINE_SPEC.md`

What not to do:
- do not auto-publish
- do not market the scanner as AI review
- do not convert this into a generic clause classifier

## B10 — Candidate Review Queue

Likely files touched:
- new or repurposed pages under `src/app/admin/`
- candidate API routes under `src/app/api/`
- repository files for candidate approval and rejection

Acceptance criteria:
- admin can list pending candidates
- admin can approve a candidate into a red flag draft
- admin can reject or defer with notes
- queue supports basic filters by platform and category

What not to do:
- do not expose the queue publicly
- do not require a multi-reviewer workflow

## B11 — Red Flag + Evidence Editor

Likely files touched:
- new admin pages under `src/app/admin/`
- new or repurposed API routes under `src/app/api/`
- repository and validation files for red flags and evidence
- `src/lib/evidence.ts`

Acceptance criteria:
- admin can edit title, category, level, summary, and why-it-matters
- admin can attach, reorder, and remove evidence
- publish is blocked if evidence is missing

What not to do:
- do not allow evidence-free publication
- do not expose full raw source captures publicly

## B12 — Survival Note / Backup / Checklist Editor

Likely files touched:
- new admin pages under `src/app/admin/`
- repository and validation files for survival notes, backup options, checklists, and checklist items

Acceptance criteria:
- admin can create and edit survival notes
- admin can create backup options with tradeoffs
- admin can create ordered checklists and checklist items

What not to do:
- do not add user-personalized checklist tracking
- do not build recommendation engines

## B13 — Publisher Preview

Likely files touched:
- new preview page under `src/app/admin/`
- repository summary queries
- admin-only preview components

Acceptance criteria:
- admin can preview a full survival page before public Epic C exists
- preview shows missing pieces and warnings
- publish or unpublish action is explicit and auditable

What not to do:
- do not expose preview under a public URL
- do not index preview content

## B14 — Safety Checks

Likely files touched:
- `src/lib/validation/`
- publish guard or service files under `src/server/services/`
- moderation and logging utilities

Acceptance criteria:
- dangerous wording detection exists for public editorial fields
- reviewed date requirement is enforced
- unpublished and pending data stay private
- admin actions produce audit trail events where needed

What not to do:
- do not turn safety checks into a giant AI moderation subsystem
- do not skip server-side enforcement in favor of frontend warnings only

## B15 — Seed demo data: Wise, PayPal, GitHub

Likely files touched:
- `schema.polibrawl.sql`
- possible seed script under `scripts/`
- optional fixture files under a new seed or fixture folder

Acceptance criteria:
- demo data exists for Wise, PayPal, and GitHub
- each seed demonstrates at least one plausible red flag, evidence item, note, backup option, and checklist
- seed data is clearly non-production and easy to rerun

What not to do:
- do not pollute legacy tables accidentally
- do not seed huge fake datasets

## B16 — lint/typecheck/build

Likely files touched:
- no code changes required unless fixes are needed from earlier phases

Acceptance criteria:
- `npm run lint` passes
- `npm run typecheck` passes
- `npm run build` passes

What not to do:
- do not stop at partial validation
- do not ignore build failures caused by route or type drift

## Recommended Build Order

1. B1
2. B2
3. B3
4. B4
5. B5
6. B6
7. B7
8. B8
9. B9
10. B10
11. B11
12. B12
13. B13
14. B14
15. B15
16. B16

## Ready-To-Copy Codex Prompt For Epic B

```text
You are working in /home/vanta/Projects/PlatFormPoc.

Implement ONLY Epic B: Internal CMS for PoliBrawl.

Before coding, read:
- docs/README.md
- docs/ARCHITECTURE.md
- docs/PROJECT_STRUCTURE.md
- docs/DESIGN_SYSTEM.md
- docs/NAVIGATION.md
- docs/STATE_MACHINE.md
- docs/NAMING_CONVENTION.md
- docs/adr/
- docs/04_DATA_MODEL.md
- docs/05_INTERNAL_CMS_PRD.md
- docs/06_PIPELINE_SPEC.md
- docs/09_EDITORIAL_SAFETY.md
- docs/10_SECURITY_POLICY.md
- docs/12_EPIC_B_INTERNAL_CMS_PLAN.md
- AGENTS.md
- the relevant Next.js guide in node_modules/next/dist/docs/ before changing Next.js code

Rules:
- Do not implement Epic C public pages yet.
- Do not delete old code yet.
- Do not overwrite legacy schema.sql. Create schema.polibrawl.sql instead.
- Do not build a crawler, forum, API product, or enterprise workflow.
- Keep the product language centered on platforms, sources, red flags, evidence, survival notes, backup options, checklists, and community submissions.
- Use additive changes and safe archival labels for legacy clause/rule/signal code.
- Prefer server-side validation, admin-only routes, and simple founder-operable workflows.

Execution order:
- B1 archive old domain references safely
- B2 create schema.polibrawl.sql
- B3 create TypeScript domain types
- B4 create repository layer
- B5 create admin layout routes
- B6 Platform Registry CRUD
- B7 Source Registry CRUD
- B8 Fetch/Paste Text
- B9 Keyword Scanner
- B10 Candidate Review Queue
- B11 Red Flag + Evidence Editor
- B12 Survival Note / Backup / Checklist Editor
- B13 Publisher Preview
- B14 Safety Checks
- B15 seed demo data for Wise, PayPal, GitHub
- B16 run lint, typecheck, build

Acceptance:
- internal CMS works for one founder operator
- no public site implementation yet
- no evidence-free red flag publishing
- no unpublished data leaks
- validation must end with npm run lint, npm run typecheck, and npm run build
```
