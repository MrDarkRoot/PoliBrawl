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
DEV_BOOTSTRAP_OWNER_EMAILS=your-admin-email@example.com
```

`DEV_BOOTSTRAP_OWNER_EMAILS` should include the email you want to use for the first admin login. The app uses it to bootstrap the first `profiles.role` as `owner`.

## 6. Run schema

```bash
npm run db:apply-schema
```

This applies the existing `schema.sql` to the Supabase Postgres database.

## 7. Run dev server

```bash
npm run dev
```

Open the local URL printed by Next.js.

## 8. Create first admin user in Supabase Auth

1. Open Supabase dashboard.
2. Go to `Authentication` → `Users`.
3. Create a user manually with email and password.
4. Use the same email address you placed in `DEV_BOOTSTRAP_OWNER_EMAILS`.
5. Sign in through `/login` in the local app.

On first successful sign-in, the app will create the matching `profiles` row automatically.

## 9. Test the Wise pipeline using `TESTING.md`

Follow [TESTING.md](/home/vanta/Projects/PlatFormPoc/TESTING.md) after:

1. Schema is applied
2. The app is running
3. The first admin user can sign in
