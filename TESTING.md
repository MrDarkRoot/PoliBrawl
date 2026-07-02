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
DEV_BOOTSTRAP_OWNER_EMAILS=your-admin-email@example.com
```

`DEV_BOOTSTRAP_OWNER_EMAILS` must include the same email as the Auth user from step 2 so the first login gets `owner` access.

## End-to-end pipeline

1. Apply the schema:

```bash
npm run db:apply-schema
```

2. Start the dev server:

```bash
npm run dev
```

3. Open the app at the local URL printed by Next.js and sign in with the Supabase Auth user from setup.

4. Create the test platform:
   Route: `/admin/platforms/new`
   Values:
   Name: `Wise`
   Slug: `wise`
   Website URL: `https://wise.com`
   Category: `payment`

5. Run discovery:
   Route: `/admin/platforms/[id]/discovery`
   Action: `Start discovery run`

6. Review candidate URLs:
   Route: `/admin/discovery/runs/[runId]` or `/admin/sources/candidates`

7. Approve one policy source:
   Route: `/admin/sources/candidates`
   Action: `Approve`

8. Fetch the source:
   Route: `/admin/sources/[sourceId]`
   Action: `Fetch source`

9. Create a document version:
   Route: `/admin/sources/[sourceId]`
   Action: `Process version`

10. Split clauses:
   Route: `/admin/sources/[sourceId]`
   Action: `Process version`
   Verification route: `/admin/clauses`
   `Process version` creates the document version and runs section/clause processing in the same UI action.

11. Run signal detection:
   Route: `/admin/rules`
   Action: `Run matcher`

12. Approve one signal:
   Route: `/admin/review`
   Open one candidate, then approve it on `/admin/review/signals/[candidateId]`

13. Create one evidence item:
   Route: `/admin/signals/[signalId]/evidence/new`
   Save the draft, then review it on `/admin/signals/[signalId]/evidence/preview?evidenceId=...`
