# Database Migration Operations

## Scope

PoliBrawl uses a canonical database apply flow for content and intelligence tables. The application expects required tables to exist before startup and now fails loudly when they do not.

This workflow covers:

- `schema.polibrawl.sql`
- additive migrations in `scripts/sql/*.sql`
- runtime table health verification

Auth tables such as `profiles` are outside this schema workflow.

## Canonical Apply Order

Use:

```bash
npm run db:apply-schema
```

The command applies database changes in deterministic order:

1. Apply `schema.polibrawl.sql`
2. Enumerate `scripts/sql/*.sql` in lexicographic order
3. Apply each additive migration once
4. Record each applied migration in `polibrawl_schema_migrations`

Additive migrations are checksum-tracked. If a previously applied migration file changes, the command fails and refuses to continue.

## Health Check

Use:

```bash
npm run db:health
```

The health check verifies these required tables exist:

- `platforms`
- `red_flags`
- `sources`
- `source_snapshots`
- `resolution_routes`
- `dependency_scores`
- `risk_timelines`
- `evidence_confidence`

Application startup also verifies this requirement in `src/instrumentation.ts`, and shared DB reads verify it through `src/server/polibrawl/db.ts`.

## Production Deployment Process

1. Confirm database connection variables are set:
   - `DATABASE_URL`, or
   - `POSTGRES_URL`, or
   - `SUPABASE_DB_URL`
2. Take a production backup or snapshot before schema work.
3. Run:

```bash
npm run db:apply-schema
```

4. Run:

```bash
npm run db:health
```

5. Build and deploy the application revision that expects the schema:

```bash
npm run build
```

6. Verify:
   - `/admin` returns `403` when unauthenticated
   - intended admin users can still authenticate
   - published public pages render without server errors

## Failure Behavior

- Missing required tables: startup and DB access fail loudly
- Broken additive migration: transaction rolls back and command exits with error
- Edited historical migration file: checksum validation fails

Do not ignore these failures. The application is intentionally fail-closed.

## Rollback Considerations

- This workflow is additive only. It does not drop or rename production columns.
- If application code is deployed before required migrations, the app will not serve affected requests. Apply the missing schema immediately or roll the application back.
- If a migration fails partway through, the active migration transaction is rolled back and the migration is not journaled.
- Do not modify previously applied migration files. Create a new additive migration instead.
