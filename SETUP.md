# Supabase Setup

## 1. Create Supabase project

1. Go to Supabase and create a new project.
2. Wait for the database and API services to finish provisioning.

## 2. Copy Project URL and anon key

1. Open `Project Settings` → `API`.
2. Copy:
   `Project URL`
3. Copy:
   `anon public` key

## 3. Copy service role key

1. Stay on `Project Settings` → `API`.
2. Copy:
   `service_role` key

## 4. Get pooled or direct database connection string

1. Open `Project Settings` → `Database`.
2. Copy either:
   pooled connection string
3. Or copy:
   direct connection string
4. Use that value for `DATABASE_URL`.

## 5. Fill `.env.local`

Create `.env.local` in the project root with:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=...
EDITORIAL_SITE_URL=http://localhost:3000
```

## 6. Run schema

```bash
npm run db:apply-schema
```

This applies the canonical PoliBrawl database workflow:

1. `schema.polibrawl.sql`
2. tracked additive migrations in `scripts/sql/*.sql`

After schema apply, verify required tables exist:

```bash
npm run db:health
```

## 7. Run dev server

```bash
npm run dev
```

Open the local URL printed by Next.js.

## 8. Create first admin user in Supabase Auth

1. Open Supabase dashboard.
2. Go to `Authentication` → `Users`.
3. Create a user manually with email and password.
4. Create the matching `profiles` row manually before using `/admin`.
5. Set `profiles.role` to one of: `owner`, `admin`, or `editor`.
6. Sign in through `/login` in the local app.

Admin access now fails closed. Missing auth environment, missing session, missing profile, or non-admin role returns `403`.

## 9. Test the Wise pipeline using `TESTING.md`

Follow [TESTING.md](/home/vanta/Projects/PlatFormPoc/TESTING.md) after:

1. Schema is applied
2. The app is running
3. The first admin user can sign in
