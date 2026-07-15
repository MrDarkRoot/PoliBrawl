# Editorial Platform Testing

## Environment setup

1. Create a Supabase project.
2. Create one Supabase Auth user manually in the Supabase dashboard.
3. Set these variables in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=...
EDITORIAL_SITE_URL=http://localhost:3000
```

## End-to-end pipeline

1. Apply the schema:

```bash
npm run db:apply-schema
```

2. Verify the required PoliBrawl tables exist:

```bash
npm run db:health
```

3. Ensure the Supabase `profiles` table contains a row for the Auth user with role `owner`, `admin`, or `editor`.

4. Start the dev server:

```bash
npm run dev
```

5. Open the app at the local URL printed by Next.js and sign in with the Supabase Auth user from setup.

6. Create the test platform:
   Route: `/admin/platforms/new`
   Values:
   Name: `Wise`
   Slug: `wise`
   Website URL: `https://wise.com`
   Category: `payment`

7. Run discovery:
   Route: `/admin/platforms/[id]/discovery`
   Action: `Start discovery run`

8. Review candidate URLs:
   Route: `/admin/discovery/runs/[runId]` or `/admin/sources/candidates`

9. Approve one policy source:
   Route: `/admin/sources/candidates`
   Action: `Approve`

10. Fetch the source:
   Route: `/admin/sources/[sourceId]`
   Action: `Fetch source`

11. Create a document version:
   Route: `/admin/sources/[sourceId]`
   Action: `Process version`

12. Split clauses:
   Route: `/admin/sources/[sourceId]`
   Action: `Process version`
   Verification route: `/admin/clauses`
   `Process version` creates the document version and runs section/clause processing in the same UI action.

13. Run signal detection:
   Route: `/admin/rules`
   Action: `Run matcher`

14. Approve one signal:
   Route: `/admin/review`
   Open one candidate, then approve it on `/admin/review/signals/[candidateId]`

15. Create one evidence item:
   Route: `/admin/signals/[signalId]/evidence/new`
   Save the draft, then review it on `/admin/signals/[signalId]/evidence/preview?evidenceId=...`
