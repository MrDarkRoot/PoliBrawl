# TODO: PoliBrawl Repository Tests

No dedicated test runner is configured in `package.json` for this repo yet.

When a test framework is added, cover at least:

- `platform.repository.ts`: insert, update, archive, list, `findBySlug`
- `source.repository.ts`: nullable URL handling and `(platform_id, url)` uniqueness behavior
- `red-flag.repository.ts`: slug lookup and archive transition
- `evidence.repository.ts`: `sort_order` persistence and approved-status updates
- `checklist-item.repository.ts`: `(checklist_id, sort_order)` uniqueness behavior
- community repositories: status transitions and nullable platform references

Suggested test setup later:

- ephemeral Postgres for integration tests
- apply `schema.polibrawl.sql` before each suite
- use repository-level tests only, with no UI or route coupling
