# Known Limitations
**PoliBrawl RC1 — Epic C Sprint 8**

This document lists real, confirmed limitations of the current product. It is not an aspirational roadmap. These limitations reflect intentional scope decisions or technical constraints encountered during the MVP build.

---

## Search

**Search is keyword-only (ILIKE)**
The current search implementation uses SQL `ILIKE` pattern matching. There is no ranking, relevance scoring, stemming, or fuzzy matching. Searching "paypal" will not find "PayPal" unless the database name matches exactly (ILIKE is case-insensitive but not typo-tolerant).

**Search does not cover evidence excerpts**
Evidence text is not indexed for search. Only platform names, summaries, and red flag titles/categories are searchable.

**No paginated search results**
Results are capped at 10 platforms + 10 red flags. There is no next-page mechanism.

---

## Routing

**Red flag URLs use UUIDs, not slugs**
`/red-flags/[id]` uses the database UUID because the `slug` column on `red_flags` is only unique per platform, not globally. A proper slug-based URL like `/platforms/[slug]/red-flags/[rf-slug]` would require a route structure change. This is deferred to a future sprint.

**No canonical redirect for old red flag UUIDs**
If red flags are ever migrated to slug-based URLs, old UUID-based links will become 404s without a redirect layer.

---

## Navigation

**No mobile hamburger menu**
The top navigation shows all links in a horizontal row. On narrow screens, items may be clipped. A hamburger or overflow menu is not implemented in MVP.

**No skip-to-content link**
While `id="main-content"` exists on `<main>` elements, there is no rendered "Skip to content" anchor at the top of the page for keyboard users.

---

## SEO

**No dynamic sitemap.xml**
There is no auto-generated `/sitemap.xml` route. Search engines can only discover pages by crawl. A sitemap would need to be generated from the database at build time or as a separate route.

**Canonical URLs are hardcoded to `https://polibrawl.com`**
The canonical URL, OpenGraph URL, and JSON-LD `item` values are hardcoded strings. If the domain changes or the site is deployed to a staging environment, these will be incorrect. A `NEXT_PUBLIC_BASE_URL` environment variable should be introduced.

---

## Content Coverage

**Coverage is incomplete**
Only platforms that have completed the full internal CMS pipeline (Platform → Source → Snapshot → Candidates → Red Flags → Survival Page) appear publicly. Many platforms may be in draft or review.

**No published-date display**
Red flags and evidence items do not display a reviewed-at or published-at date on the public page. This makes it harder for users to assess freshness. The `reviewed_at` and `published_at` columns exist in the schema but are not rendered.

---

## Editorial Workflow

**No public correction form**
Users cannot submit corrections from the public site. The `corrections` table exists in the schema but there is no public-facing form in Sprint 7/8.

**No watcher/subscribe form**
Platform watchers are not exposed on the public site. The `platform_watchers` table exists in schema but there is no subscribe UI.

**No community signals display**
The `experience_submissions`, `review_requests`, and `survival_tip_submissions` tables exist but no aggregate community signal block is rendered on the public platform page.

---

## Performance

**No caching layer**
All dynamic routes hit the database on every request. There is no query-level cache, ISR, or CDN-level caching configured. For high traffic, this will cause database load.

**No image optimization**
There are currently no images on public pages, so this is not a problem in practice. If platform logos or screenshots are added in the future, they should use `next/image`.

---

## Accessibility

**Risk badge color contrast not WCAG-audited programmatically**
Risk level badges (critical, high, medium, low) use color-coded styles that are visually distinct, but no automated WCAG 2.1 AA contrast ratio test has been run against the actual computed values.

**No focus-visible outline on all interactive elements**
Tailwind's default `focus-visible:ring` is applied on most interactive elements but may not cover all custom components consistently.

---

## Infrastructure

**No analytics**
There is no page view tracking, event tracking, or conversion measurement. This is intentional for RC1 privacy posture.

**No error monitoring**
There is no Sentry or equivalent error monitoring. Runtime errors on server components will not surface beyond server logs.

**No rate limiting on public routes**
Search and other public GET routes are not rate limited. This is acceptable for low-traffic early beta but should be addressed before broader launch.

---

## Multilingual

**English-only**
All editorial content, UI copy, and metadata are English-only. No i18n framework is in place.

---

## Versioning

**No policy version history**
Source snapshots are stored in the database but not exposed publicly. Users cannot compare current vs. previous policy text.

**No diff display**
No visual diff between policy versions is implemented.

---

## Collaboration

**Single-editor workflow only**
The CMS is designed for a solo founder or small team. There is no editor assignment, concurrent review locking, or editor-level permissions beyond basic auth.
