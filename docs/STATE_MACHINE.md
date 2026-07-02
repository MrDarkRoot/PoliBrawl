# State Machine

This document defines target status values and transition rules for Epic B.

## platform.status

- draft
- published
- needs_review
- archived

Typical transitions:
- `draft -> published`
- `published -> needs_review`
- `needs_review -> published`
- `published -> archived`

## source.status

- draft
- active
- archived
- failed_capture

Typical transitions:
- `draft -> active`
- `draft -> failed_capture`
- `failed_capture -> draft`
- `active -> archived`

## source.priority

- core
- supporting
- ignore

## red_flag_candidate.status

- pending
- accepted
- rejected_noise
- duplicate
- needs_more_review

Typical transitions:
- `pending -> accepted`
- `pending -> rejected_noise`
- `pending -> duplicate`
- `pending -> needs_more_review`

## red_flag.status

- draft
- ready_for_review
- published
- archived

Typical transitions:
- `draft -> ready_for_review`
- `ready_for_review -> published`
- `published -> archived`
- `published -> draft` only if unpublished for correction

## evidence.status

- draft
- approved
- archived

Typical transitions:
- `draft -> approved`
- `approved -> archived`

## survival_note.status

- draft
- published
- archived

Typical transitions:
- `draft -> published`
- `published -> archived`

## backup_option.status

- draft
- published
- archived

Typical transitions:
- `draft -> published`
- `published -> archived`

## checklist.status

- draft
- published
- archived

Typical transitions:
- `draft -> published`
- `published -> archived`

## Community Submission Statuses

- pending
- reviewed
- use_as_private_signal
- published_summary
- rejected

Applies to:
- review requests where moderation state is needed
- experience submissions
- survival tip submissions

Typical transitions:
- `pending -> reviewed`
- `reviewed -> use_as_private_signal`
- `reviewed -> published_summary`
- `pending -> rejected`
- `reviewed -> rejected`

## correction.status

- pending
- reviewing
- resolved
- rejected

Typical transitions:
- `pending -> reviewing`
- `reviewing -> resolved`
- `reviewing -> rejected`

## Publish Guard For `red_flag.status`

A red flag can move to `published` only if:
- it has at least one approved evidence item
- `reviewed_at` exists
- dangerous wording check passes or admin explicitly confirms
- platform is not archived

## Publish Guard For `platform.status`

Platform can move to `published` only if:
- summary exists
- at least one published red flag exists
- page-level disclaimer is available
- `last_reviewed_at` exists

## Visibility Rule

Public pages must query only published or approved states. Pending, draft, archived, failed, and private-signal records must stay out of public queries by default.
