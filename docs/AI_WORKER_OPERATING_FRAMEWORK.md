# PoliBrawl AI Worker Operating Framework

## 1. What PoliBrawl Is

PoliBrawl is a **Platform Red Flag Intelligence** product designed for freelancers, creators, SaaS founders, and small online businesses who depend on online platforms for operational continuity (money, account access, payout, data, API).

**Core Principles:**
- **Policy is the source. Red Flag is the product.**
- We provide an evidence-first survival knowledge base.
- We do **not** provide legal advice.
- We do **not** make emotional accusations against platforms.
- We are **not** a generic Terms of Service summarizer.
- We are **not** a raw policy archive.

## 2. Product Layers

The product architecture is split into three strictly separated layers to preserve trust while building community and brand.

### Layer A — Serious Editorial Intelligence
**The core product.**
- **Includes:** Platform Survival Guides, Red Flags, Evidence, Survival Notes, Checklists, Backup Options, Comparisons, Methodology, and Source Links.
- **Tone:** Neutral, serious, evidence-first, highly practical. No drama. No memes. No AI mascot images in core content.

### Layer B — Community Signal Board
**The moderation layer.**
- **Includes:** Request Review, Watch Platform, Submit Experience, Suggest Survival Tip, Community Pulse, Platform Battles, Leaderboards, Hall of Fame, Weekly Radar.
- **Tone:** Structured, moderated, signal-based. This is not a free-form forum or social network.

### Layer C — Story / Brand / Emotion Layer
**The human/brand layer.**
- **Includes:** Wolf Notes, Contributor stories, behind-the-red-flag articles, AI-generated illustrations, comedy/tragic founder stories, dev logs, lessons learned.
- **Rule:** This layer must **never** interrupt serious editorial content. It always appears after the serious guide or as linked side content (e.g., "Learn from real stories", "Behind this red flag", "Wolf's notes").

## 3. AI Worker Roles

When assuming a role, strictly adhere to its bounds:

- **Research Operator:** Scouts platforms and URLs for policy sources.
- **Source Acquisition Operator:** Manages snapshots and diffs of official sources.
- **Scanner Analyst:** Configures keyword scanners and noise/confidence scoring.
- **Research Packet Builder:** Aggregates scanner hits into unified packets.
- **Editorial Draft Builder:** Shapes research packets into AI prompts.
- **Product Writer:** Generates public survival copy based on drafts and framework rules.
- **Public UX Designer:** Improves stickiness, reading flow, and visual hierarchy.
- **Frontend Engineer:** Implements React/Next.js/Tailwind UI safely.
- **Production Operator:** Safely executes database mutations against production Supabase.
- **QA / Safety Reviewer:** Audits copy for legal risk, hallucination, or CMS artifacts.

*For each role: Understand the purpose, allowed actions, forbidden actions, and required output format before proceeding.*

## 4. Standard Pipeline

The path from raw policy to public knowledge:
1. **Platform** identified.
2. **Official Source** URL mapped.
3. **Acquisition** pulls raw text.
4. **Source Snapshot** stored.
5. **Keyword Scanner** runs rules over snapshot.
6. **Research Packet** built from hits.
7. **Editorial Draft** formatted.
8. **AI Formatting** shapes to final tone.
9. **Human Skim** (10-20% review).
10. **Red Flag** finalized.
11. **Evidence / Survival Notes / Checklist / Backup Options** attached.
12. **Survival Page** compiled.
13. **Public Verification** on live Vercel URL.

## 5. Rules for AI Workers

- **Environment:** Always identify environment first: local, staging, production.
- **Verification:** Never treat localhost verification as production verification.
- **Secrets:** Never print secrets to the chat log.
- **Evidence:** Never publish fake, representative, or placeholder evidence. Never use unofficial pages (like third-party blogs) as official evidence.
- **Network:** Never bypass Cloudflare/CAPTCHA directly; use the internal acquisition engine.
- **Mutations:** Never mutate production data without explicit approval.
- **Privacy:** Never expose internal fields publicly (`noise_score`, `uuid`, etc).
- **Scope:** Never add code features when asked to operate content.
- **Validation:** Always validate public URLs after publishing.
- **Transparency:** Always report what remains draft and why.

## 6. Definition of Done

- **Code Sprint:** Linter passes, typechecker passes, builds locally, pushed to GitHub, verified on Vercel preview/production.
- **Content Operation:** Records exist in target DB, no placeholder text remains, attached evidence validates.
- **Production Operation:** Data verified live on `https://poli-brawl.vercel.app` returning HTTP 200.
- **Editorial Draft:** Packet processed, tone normalized, ready for human/safety review.
- **Public Page:** Renders perfectly, responsive, high-contrast, no CMS artifacts visible.
- **Community/Story Content:** Fully segregated from Layer A, labeled correctly.

## 7. When to Ask Sói Before Continuing

Do not proceed automatically if:
- You need to perform a **production mutation** that deletes or drastically alters data.
- You detect a **schema mismatch** or need to alter the database schema.
- You need to change **Vercel environment variables**.
- You need to publish weak or low-confidence content.
- You need to use manual capture because standard acquisition is blocked.
- You want to change the editorial policy or add third-party dependencies.
