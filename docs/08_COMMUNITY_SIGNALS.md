# Community Signals

PoliBrawl uses structured community signals to improve editorial prioritization and practical guidance.

Important rules:
- No free-form forum.
- No public raw accusations.
- No comments.
- No auto-publish.

Public display should use aggregate counts first.

## Signal Types

## Request Review

Purpose: let users request coverage or updates for a platform.

Suggested fields:
- platform name or platform ID
- optional reason
- optional email

Public display:
- total requests
- recent demand trend if safe

## Watch Platform

Purpose: let users subscribe for platform updates.

Suggested fields:
- platform ID
- email

Public display:
- watcher count only

## Submit Experience

Purpose: collect structured evidence of user experiences without creating a public rant stream.

Suggested fields:
- platform ID
- issue category
- short summary
- optional country
- optional amount range
- optional evidence note

Public display:
- aggregate counts by category
- approved anonymized summary only if safe

## Suggest Survival Tip

Purpose: collect practical user suggestions that may help other platform-dependent workers.

Suggested fields:
- platform ID
- tip summary
- optional details

Public display:
- approved tips only
- never raw pending submissions

## Correction

Purpose: let users flag outdated or incorrect PoliBrawl content.

Suggested fields:
- platform ID optional
- issue type
- message
- source URL optional
- contact email optional

Public display:
- no raw public display

## Moderation Model

All community signals start as `pending`.

Possible moderation outcomes:
- rejected
- private-only signal
- approved aggregate
- approved anonymized summary
- approved tip
- correction task created

## Product Rule

Community signals should help answer:
- what platforms deserve coverage
- what risks users repeatedly mention
- what practical tips are worth reviewing
- what content needs correction or refresh

Community signals should not become:
- a public accusation board
- an identity-based social network
- a free-form complaint wall
