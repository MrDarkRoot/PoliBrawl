# AI Editorial Worker Framework

## Purpose

Sprint 10 adds a controlled editorial automation layer between research packets and human publishing.

The goal is not to auto-publish AI copy.

The goal is to:

- turn research packets into structured editorial drafts
- keep every draft tied to evidence
- force human review before approval
- keep AI output fully outside the public rendering path

## Editorial position

PoliBrawl is an evidence-first operational intelligence product.

The AI Editorial Worker may:

- summarize official evidence
- translate policy language into operational consequences
- organize actions into clearer survival guidance
- generate a draft checklist and backup options

The AI Editorial Worker may not:

- invent policy facts
- guarantee outcomes
- change the meaning of official evidence
- produce legal advice
- publish directly

## Runtime flow

Research Packet -> AI Editorial Worker -> Editorial Draft -> Human Review -> Optional Publish State

This sprint adds only the foundation:

- draft persistence
- provider abstraction
- validation
- admin review UI
- local demo generation

It does not add:

- external AI provider calls
- public rendering of drafts
- automatic publishing

## Data model

### `editorial_drafts`

Stores structured AI-assisted drafts with explicit review state.

Core fields:

- `platform_id`
- `red_flag_id`
- `research_packet_id`
- `draft_type`
- `title`
- `summary`
- `who_is_affected`
- `why_it_matters`
- `survival_actions`
- `checklist_items`
- `backup_options`
- `evidence_summary`
- `evidence_reference_ids`
- `ai_confidence`
- `status`
- `created_at`
- `reviewed_at`
- `published_at`

## Draft types

- `platform_survival_guide`
- `red_flag_analysis`
- `policy_change_summary`

## Review states

- `draft`
- `review_requested`
- `approved`
- `published`
- `rejected`

Rules:

- new AI output always starts as `draft`
- `published` is invalid unless the record was previously `approved`
- drafts are never used by public routes

## Provider abstraction

The worker uses an `EditorialAIProvider` interface so the draft-generation layer is not coupled to any one vendor.

Initial implementation:

- `LocalTemplateEditorialAIProvider`

This provider is deterministic and does not call external APIs.

Future providers can implement the same interface for:

- OpenAI
- Gemini
- Claude
- local/self-hosted models

## Template system

Templates define:

- system instructions
- forbidden claims
- required fields
- output schema

Sprint 10 adds:

- `platform-survival-guide.ts`
- `red-flag-analysis.ts`
- `policy-change-summary.ts`

## Safety model

AI output is treated as untrusted input.

Before any draft is saved:

1. output schema is validated
2. forbidden claims are checked
3. evidence references must exist
4. affected users must exist
5. at least one action and checklist item must exist

If validation fails, the draft is rejected and not stored.

## Human review UX

Admin route:

- `/admin/editorial-drafts`

Capabilities:

- list drafts
- filter by review state
- open/edit draft
- approve
- reject
- publish only after approval

## Demo workflow

Sprint 10 includes a local demo path:

- locate an existing PayPal research packet
- generate a saved editorial draft
- keep the draft in `draft` status

This proves the pipeline without touching public content.

## Security boundaries

- no external AI calls are made automatically
- no secrets or API keys are required
- no public route renders editorial drafts
- internal scanner metadata remains admin-only
- evidence references stay attached to the originating research packet evidence

## Quality gates

Required validation:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test:hardening`

Required test coverage:

- draft cannot publish without approval
- unsupported claims are rejected
- missing evidence is rejected
- draft content is not public unless status is `published`
