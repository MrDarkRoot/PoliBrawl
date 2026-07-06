# PoliBrawl Production Operations SOP

## 1. Environment Rules

**Local Environment:**
- Used for development and testing only.
- **Rule:** Localhost verification does NOT prove production readiness. A success on `localhost:3000` is only the first step.

**Production Environment:**
- Driven by the Vercel public URL and the Supabase production database.
- **Rule:** You must verify the database target variables *before* running any operations.

## 2. DB Target Check
Before executing operations (e.g., seeding, syncing, content updates), AI workers must verify the active database.
**Required Action:** Print the safe shape of the target connection:
- Host
- Port
- Database Name
- Project Ref (if Supabase)

**Forbidden:**
- NEVER print the password.
- NEVER print the full `DATABASE_URL` string in the logs.
- If the Host is `localhost` but you were tasked with a production operation, **STOP** and ask for clarification.

## 3. Production Content Operation Steps
When instructed to operate on production content, follow this strict sequence:
1. **Confirm DB target** (via safe shape print).
2. **Choose platform** and verify the existing slug.
3. **Create/update records carefully** (do not perform blind bulk drops).
4. **Run acquisition** to pull fresh official policies.
5. **Create snapshots** for immutability.
6. **Scan** the snapshots using the Keyword Scanner.
7. **Create research packets** from hits.
8. **Draft red flags** and attach exact official evidence.
9. **Run quality gate** (Safety Reviewer prompt).
10. **Compose survival page.**
11. **Verify public URL** live on Vercel.

## 4. Vercel Rules
When interacting with the Vercel deployment:
- Do **not** change environment variables without explicit approval from Sói.
- Do **not** delete the project or modify domains/DNS.
- Do **not** trigger manual redeployments unless explicitly approved, or if the standard GitHub push fails to trigger one.
- **Always** verify the deployment status and live URLs after a GitHub push.

## 5. Git Rules
Standard repository hygiene:
- Always run `git status` before staging.
- Do **not** commit `.env.local`, `node_modules`, `.next`, or temporary artifacts.
- Do **not** commit any files containing secrets.
- Always run `npm run lint`, `npm run typecheck`, and `npm run build` before pushing.
- Push only to the intended, explicitly requested branch (usually `main`).

## 6. Secret Safety
**Never print these values to the chat transcript:**
- Full `DATABASE_URL`
- Supabase Service Key or anon key
- JWTs or session tokens
- API keys (OpenAI, Vercel, etc.)
- Database passwords or connection strings

## 7. Public Verification
A production operation is only considered "Done" when:
- The production URL returns an `HTTP 200`.
- The public page renders the expected content.
- No internal CMS fields (e.g., `noise_score`, `uuid`) are exposed.
- No placeholder copy (e.g., "Analysis reveals...", "minimum constraint") is visible.
- Evidence links are present and functional.
- Draft or unpublished pages correctly return `HTTP 404`.

## 8. Rollback / Stop Conditions
**Stop immediately and ask Sói if:**
- A production mutation is highly destructive or risky (e.g., dropping tables).
- A schema mismatch appears between code and the database.
- Partial or corrupt data threatens to pollute the public UI.
- Official sources are blocking acquisition (e.g., heavy Cloudflare blocks).
- A live route returns an `HTTP 500`.
- Evidence is missing for a drafted red flag.
- The page contains placeholder artifacts that the sanitizer failed to catch.
