# Naming Convention

This document prevents naming drift during Epic B.

## Database

- use snake_case plural table names: `platforms`, `red_flags`, `evidence`, `survival_notes`
- use foreign keys such as `platform_id`, `red_flag_id`, `source_id`
- use timestamps such as `created_at`, `updated_at`, `reviewed_at`, `published_at`, `archived_at`

## TypeScript

- use PascalCase types such as `Platform`, `RedFlag`, `EvidenceItem`, `SurvivalNote`
- use camelCase variables and functions such as `getPlatformBySlug`, `listRedFlagsForPlatform`

## Repository Files

- `platform.repository.ts`
- `red-flag.repository.ts`
- `evidence.repository.ts`

## Service Files

- `keyword-scanner.service.ts`
- `publisher.service.ts`
- `safety-check.service.ts`

## Schema Files

- `platform.schema.ts`
- `red-flag.schema.ts`
- `evidence.schema.ts`

## Routes

- URLs use kebab-case
- `/admin/red-flags`
- `/admin/survival-notes`
- `/platforms/paypal`

## Product Copy

- Use `Red Flag`, not `Signal` in product UI.
- Use `Source`, not `Document` unless referring to legacy.
- Use `Evidence`, not `Clause`.
- Use `Community Signal`, not `Post`.

## Legacy Boundary

Legacy terms such as document, clause, rule, and signal may still appear in old code during transition. New Epic B code, docs, route names, and UI labels should use the PoliBrawl MVP vocabulary by default.
