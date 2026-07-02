# MVP Data Model

This document defines the MVP entities for PoliBrawl. The names below are the target product model even if the current codebase still contains legacy tables and types.

Global rules:
- No evidence => red flag cannot publish.
- Community submissions default to pending.
- Public pages only show published red flags and approved or safe aggregate signals.
- Sources are internal evidence inputs, not the product.

## platforms

Purpose: master registry of platforms covered by PoliBrawl.

Key fields:
- `id`
- `slug`
- `name`
- `category`
- `status`
- `summary`
- `website_url`
- `last_reviewed_at`

Public/private status: mixed. Public pages can expose name, slug, category, summary, and review metadata. Internal status and notes stay private.

Important rules:
- one canonical platform record per platform
- category should stay within Payment, Creator/Freelance, or SaaS/Developer
- platform pages should only render published content

## sources

Purpose: internal registry of official or high-trust source material used to support editorial review.

Key fields:
- `id`
- `platform_id`
- `source_type`
- `title`
- `url`
- `body_text`
- `captured_at`
- `review_status`
- `notes`

Public/private status: private.

Important rules:
- sources are evidence inputs, not public product units
- store enough metadata to trace where evidence came from
- future fetch tools must respect SSRF and size limits

## red_flag_candidates

Purpose: scanner or editor-generated candidate findings awaiting review.

Key fields:
- `id`
- `platform_id`
- `source_id`
- `category`
- `headline`
- `excerpt`
- `matched_keywords`
- `status`
- `confidence_note`

Public/private status: private.

Important rules:
- candidates are never public
- candidates must be promoted by human review
- scanner output should help prioritization, not publication

## red_flags

Purpose: the core editorial product record shown on public survival pages after review.

Key fields:
- `id`
- `platform_id`
- `slug`
- `title`
- `category`
- `level`
- `summary`
- `why_it_matters`
- `status`
- `reviewed_at`
- `published_at`

Public/private status: mixed. Published records are public. Draft and internal notes remain private.

Important rules:
- no evidence means no publish
- level should be editorial, not numeric hype
- reviewed date is required before publication

## evidence

Purpose: source-linked proof attached to a red flag.

Key fields:
- `id`
- `red_flag_id`
- `source_id`
- `excerpt`
- `source_title`
- `source_url`
- `reviewed_at`
- `sort_order`

Public/private status: mixed. Approved short excerpts are public; raw source capture stays private.

Important rules:
- keep public excerpts short
- each evidence item must trace back to a source
- public evidence must be linkable and reviewed

## survival_notes

Purpose: practical editorial guidance for how users should interpret and respond to a red flag.

Key fields:
- `id`
- `red_flag_id`
- `note_title`
- `note_body`
- `priority`
- `status`

Public/private status: mixed. Published notes are public. Draft notes are private.

Important rules:
- survival notes must stay practical
- avoid legal-advice phrasing
- tie notes to specific red flags or page sections

## backup_options

Purpose: alternative platforms or fallback strategies users can consider.

Key fields:
- `id`
- `platform_id`
- `label`
- `option_type`
- `summary`
- `tradeoffs`
- `link_url`
- `status`

Public/private status: mixed. Published options are public. Working notes stay private.

Important rules:
- every public option should include tradeoffs
- no disguised sponsorship
- recommendations must remain clearly editorial

## checklists

Purpose: container for platform survival checklist sections.

Key fields:
- `id`
- `platform_id`
- `title`
- `intro`
- `status`

Public/private status: mixed.

Important rules:
- keep checklists platform-specific
- a platform can have one active primary checklist in MVP

## checklist_items

Purpose: actionable steps within a checklist.

Key fields:
- `id`
- `checklist_id`
- `label`
- `details`
- `sort_order`
- `status`

Public/private status: mixed.

Important rules:
- checklist items should be concrete and scannable
- items can publish only through a published checklist

## review_requests

Purpose: public intake for users asking PoliBrawl to review a platform.

Key fields:
- `id`
- `platform_name_or_id`
- `email_optional`
- `message_optional`
- `status`
- `submitted_at`

Public/private status: private with optional aggregate counts.

Important rules:
- raw submissions remain private
- public surfaces should show counts, not individual requests

## platform_watchers

Purpose: email capture for users who want updates about a platform.

Key fields:
- `id`
- `platform_id`
- `email`
- `status`
- `subscribed_at`
- `unsubscribed_at`

Public/private status: private with optional aggregate counts.

Important rules:
- email usage must be disclosed
- support unsubscribe
- never expose raw subscriber lists publicly

## experience_submissions

Purpose: structured community reports about real platform experiences.

Key fields:
- `id`
- `platform_id`
- `category`
- `summary`
- `country_optional`
- `amount_range_optional`
- `evidence_note_optional`
- `status`
- `submitted_at`

Public/private status: private by default with approved aggregate outputs.

Important rules:
- default status is pending
- no raw story auto-publish
- publish only safe aggregates or anonymized summaries

## survival_tip_submissions

Purpose: community-submitted practical suggestions for handling platform risks.

Key fields:
- `id`
- `platform_id`
- `tip_summary`
- `details_optional`
- `status`
- `submitted_at`

Public/private status: private by default with approved published tips.

Important rules:
- default status is pending
- published tips must be reviewed for safety and quality

## corrections

Purpose: intake for outdated, wrong, broken, or risky public content reports.

Key fields:
- `id`
- `platform_id_optional`
- `issue_type`
- `message`
- `source_url_optional`
- `contact_email_optional`
- `status`
- `submitted_at`

Public/private status: private.

Important rules:
- correction reports should create internal review work
- public pages may show that corrections are welcome, but not raw submissions
