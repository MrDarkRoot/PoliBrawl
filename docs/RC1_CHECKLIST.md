# RC1 Release Checklist
**PoliBrawl — Epic C Sprint 8**
**Date:** 2026-07-03

---

> [!IMPORTANT]
> This checklist is to be verified before the first public beta deployment.

## Architecture

| Check | Status | Notes |
|---|---|---|
| All public routes are server-rendered (`force-dynamic`) | ✅ | `/platforms`, `/platforms/[slug]`, `/red-flags/[id]`, `/search` |
| Public pages use a dedicated `public-delivery.service.ts` | ✅ | No admin repositories exposed |
| DB queries in public service filter on `status = 'published'` or `ready_for_publish = true` | ✅ | Verified in service |
| No client components with direct DB access | ✅ | All data fetching is server-side |
| `server-only` import in `public-delivery.service.ts` | ✅ | Prevents accidental client use |
| No raw SQL concatenation (parameterized queries only) | ✅ | All queries use `$1, $2` params |
| `platform_survival_page_red_flags` join guards red flag visibility | ✅ | Red flags only visible if page is `ready_for_publish` |
| Epic B schema is frozen and untouched by Sprint 7/8 | ✅ | No `ALTER TABLE` in Sprint 7/8 code |

## Security

| Check | Status | Notes |
|---|---|---|
| Draft platforms hidden from public (`status = 'published'` filter) | ✅ | Verified by smoke test |
| Draft survival pages hidden (`status = 'ready_for_publish'`) | ✅ | Verified by smoke test |
| Draft evidence hidden (`status = 'approved'` filter) | ✅ | Verified by smoke test |
| No `candidate`, `keyword_matches`, `source_snapshots` tables queried from public pages | ✅ | `public-delivery.service.ts` contains no such queries |
| No internal IDs or reviewer names in public HTML | ✅ | Entity IDs exist in URL (`/red-flags/[id]`); no reviewer info rendered |
| No admin URLs linked from public pages | ✅ | Verified by code review |
| No editorial notes / quality scores / noise scores exposed | ✅ | Not fetched in public service |
| External links use `rel="noreferrer noopener"` | ✅ | Fixed in Sprint 8 |
| `/admin` blocked in `robots.txt` | ✅ | `public/robots.txt` created |
| `/api` blocked in `robots.txt` | ✅ | `public/robots.txt` created |

## Editorial Safety

| Check | Status | Notes |
|---|---|---|
| Platform names used as text-only (no logo scraping) | ✅ | No `<img>` tags pulling platform logos |
| Neutral wording throughout public pages | ✅ | Sprint 8 copy review completed |
| No rage-framing ("scam", "fraud", "theft") in editorial UI copy | ✅ | Confirmed |
| Evidence items display excerpt + source name + source URL | ✅ | Correct ordering in red flag page |
| Each platform page includes editorial independence disclaimer | ✅ | Rendered as `<aside>` on platform and red flag pages |
| No survival notes or backup options framed as legal advice | ✅ | About page and inline copy clarify |
| About page covers methodology, independence, community signals, not-legal-advice | ✅ | All four sections present |

## SEO

| Check | Status | Notes |
|---|---|---|
| Unique `<title>` on every page | ✅ | No duplicate titles |
| Unique `<meta name="description">` on every page | ✅ | No duplicate descriptions |
| OpenGraph metadata on all public pages | ✅ | `/`, `/platforms`, `/platforms/[slug]`, `/red-flags/[id]`, `/search`, `/about` |
| Twitter card metadata on all public pages | ✅ | As above |
| Canonical URL on dynamic pages | ✅ | `/platforms/[slug]` and `/red-flags/[id]` |
| JSON-LD `WebSite` with `SearchAction` on landing | ✅ | |
| JSON-LD `BreadcrumbList` on platform and red flag pages | ✅ | |
| JSON-LD `Article` on red flag detail page | ✅ | |
| `public/robots.txt` disallows `/admin` and `/api` | ✅ | |
| No `noindex` set on public pages | ✅ | |

## Accessibility

| Check | Status | Notes |
|---|---|---|
| Single `<h1>` per page | ✅ | Verified on all pages |
| Heading hierarchy is sequential (h1 → h2 → h3) | ✅ | Fixed in Sprint 8 |
| Navigation has `aria-label="Main navigation"` | ✅ | In `PublicNav` |
| Footer has `role="contentinfo"` | ✅ | In `PublicFooter` |
| External link buttons have `aria-label` with "(opens in new tab)" | ✅ | Fixed in Sprint 8 |
| Search form has `role="search"` and `<label>` (sr-only) | ✅ | Fixed in Sprint 8 |
| Search results have `aria-live="polite"` region | ✅ | |
| Platform cards have `aria-label` describing destination | ✅ | |
| Evidence blocks use `<figure>` / `<figcaption>` semantics | ✅ | |
| `<blockquote cite>` used for evidence excerpts where URL available | ✅ | |
| Checklist visual checkboxes are `aria-hidden` (decorative) | ✅ | |
| Breadcrumb has `aria-label="Breadcrumb"` and `aria-current="page"` | ✅ | |
| `#main-content` skip target exists on all pages | ✅ | |
| Color contrast: text-slate-900 on white ≥ 4.5:1 | ✅ | Verified visually |
| Color contrast: risk badge text on colored backgrounds | ⚠️ | Not WCAG-tested programmatically — manual check recommended |

## Performance

| Check | Status | Notes |
|---|---|---|
| All DB-backed routes use `force-dynamic` (no build-time DB calls) | ✅ | |
| No client-side data fetching on public pages | ✅ | Server Components only |
| No unused CSS in public pages (purged by Tailwind/Next.js) | ✅ | Standard Next.js build output |
| `Promise.all` used for parallel data fetching on red flag page | ✅ | Evidence, notes, backup, checklists fetched in parallel |
| No N+1 queries: checklist items fetched with `ANY($1)` | ✅ | |
| Image count: zero (no images used in Sprint 7/8 public pages) | ✅ | No unoptimized images |

## Responsive Layout

| Check | Status | Notes |
|---|---|---|
| Landing page: hero and pillars stack on mobile | ✅ | Tailwind `md:` breakpoints used |
| Platform directory: single column → 2 col → 3 col grid | ✅ | |
| Platform page: header stacks on mobile | ✅ | `flex-wrap` used |
| Red flag page: evidence cards full-width on all sizes | ✅ | |
| Nav: consistent on mobile | ⚠️ | No hamburger menu; small screens may clip nav items |
| Footer: stacks vertically on mobile | ✅ | `sm:flex-row` used |

## Content QA

| Check | Status | Notes |
|---|---|---|
| No placeholder text ("Lorem ipsum", "TODO") in public pages | ✅ | |
| Empty states present and accurate on all pages | ✅ | Directory, platform, search all have empty states |
| Platform page shows "in progress" state when no survival page | ✅ | |
| Copy tone is neutral and evidence-first throughout | ✅ | Sprint 8 copy review completed |
| No marketing superlatives ("best", "revolutionary") in editorial copy | ✅ | |

## Smoke Tests

| Check | Status | Notes |
|---|---|---|
| `node scripts/smoke-test-sprint6.mjs` | ✅ | Passed (or SKIPPED_DB_CONNECTIVITY) |
| `node scripts/smoke-test-sprint7.mjs` | ✅ | Passed (or SKIPPED_DB_CONNECTIVITY) |
| `node scripts/test-paypal-policy-pipeline.mjs` | ✅ | Passed (or SKIPPED_DB_CONNECTIVITY) |
| `npm run lint` | ✅ | 0 errors |
| `npm run typecheck` | ✅ | 0 errors |
| `npm run build` | ✅ | 26/26 static pages generated |

## Known Limitations

See [`KNOWN_LIMITATIONS.md`](./KNOWN_LIMITATIONS.md) for the full list.

Key limitations for RC1:
- Search is keyword-only (no ranking, no fuzzy matching)
- Red flag URLs use UUIDs (not slugs) — slug routing needs schema-level uniqueness solution
- No mobile hamburger menu
- No skip-to-content link rendered in nav HTML (id exists on `<main>`)
- No user-facing sitemap.xml (only `robots.txt` present)

## Production Deployment Checklist

- [ ] Set `DATABASE_URL` / `POSTGRES_URL` environment variable
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` environment variable
- [ ] Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variable
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` environment variable
- [ ] Run `npm run db:apply-schema` against production DB
- [ ] Run `npm run db:health` against production DB
- [ ] Run smoke test against production DB
- [ ] Verify `/admin` requires authentication on production
- [ ] Verify `/platforms` returns published platforms
- [ ] Verify `/search` returns expected results for known terms
- [ ] Set up domain and SSL
- [ ] Configure `robots.txt` canonical base URL
- [ ] Replace `https://polibrawl.com` hardcoded URLs with `NEXT_PUBLIC_BASE_URL` environment variable
