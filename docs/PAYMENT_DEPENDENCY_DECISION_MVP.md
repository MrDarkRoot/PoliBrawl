# Payment Dependency Decision MVP

## Product Definition

PoliBrawl now includes a focused payment dependency decision assistant for independent online workers receiving international payments. The first user group is bug bounty researchers and freelancers in Vietnam, with creators, consultants, and indie hackers as adjacent users.

The workflow answers one urgent decision: before depending on a payout platform, what risks should the user know, what preparation should they complete, and what backup plan should they have?

## Boundary

This sprint does not expand the AI editorial worker, crawler, telemetry dashboard, community system, enterprise vendor-risk tooling, billing, vector search, autonomous publishing, or platform ranking. Existing systems remain frozen unless reused through public reviewed data.

## Decision Flow

1. User submits a short non-sensitive questionnaire.
2. The server validates country, work type, platform slug, amount range, frequency, usage role, backup state, and concerns with Zod.
3. A decision-facing evidence loader maps published platform data into a safe structured profile.
4. Deterministic TypeScript rules produce matched reasons, actions, limitations, and a recommendation code.
5. The report renders without any AI provider.
6. A random opaque token makes the report shareable.

## Rule Architecture

Rules are deterministic, prioritized, evidence-aware objects. Each rule returns a key, recommendation candidate, priority, reason, action codes, required risk categories, confidence adjustment, and limitation codes. Recommendation conflicts are resolved by explicit priority.

No rule emits `SAFE`, `UNSAFE`, `BEST PLATFORM`, `LOWEST RISK`, or a guaranteed prediction.

## Recommendation Codes

- `SUITABLE_AS_SECONDARY_METHOD`
- `USE_WITH_VERIFIED_BACKUP`
- `AVOID_SINGLE_PLATFORM_DEPENDENCY`
- `COMPLETE_VERIFICATION_BEFORE_LARGE_PAYMENT`
- `MINIMIZE_STORED_BALANCE`
- `VERIFY_COUNTRY_ELIGIBILITY`
- `VERIFY_PAYER_COMPATIBILITY`
- `FURTHER_REVIEW_REQUIRED`

## Action Codes

- `COMPLETE_IDENTITY_VERIFICATION`
- `PREPARE_BUSINESS_DOCUMENTS`
- `PRESERVE_PAYMENT_SOURCE_RECORDS`
- `PRESERVE_INVOICES`
- `PRESERVE_DELIVERY_EVIDENCE`
- `VERIFY_WITHDRAWAL_PATH`
- `TEST_SMALL_WITHDRAWAL`
- `ADD_SECONDARY_PAYOUT_ROUTE`
- `MINIMIZE_PLATFORM_BALANCE`
- `EXPORT_TRANSACTION_HISTORY`
- `SAVE_SUPPORT_CORRESPONDENCE`
- `CONFIRM_PAYER_SUPPORT`
- `VERIFY_COUNTRY_SUPPORT`
- `PLAN_WITHDRAWAL_SCHEDULE`

## Evidence Model

The decision loader uses only explicit public fields from:

- published `platforms`
- active reviewed `sources`
- published `red_flags`
- approved `evidence`
- published `resolution_routes`

The public report excludes internal database IDs, source snapshot IDs, research packet IDs, candidate IDs, scanner metadata, telemetry, admin notes, and raw AI output.

## Readiness Model

Platform readiness states:

- `decision_ready`
- `partial_evidence`
- `country_verification_required`
- `not_reviewed`

A high-confidence recommendation is not produced for partial or unverified data.

## Confidence Model

Public confidence levels are `low`, `moderate`, and `high`.

Confidence increases when official source coverage, approved evidence, reviewed dates, country support, payer support, withdrawal paths, and appeal routes are documented.

Confidence decreases when country eligibility, payer compatibility, withdrawal availability, reviewed dates, evidence coverage, appeal clarity, or discretionary policy language is incomplete.

## Privacy Model

The questionnaire does not collect email, exact income, identity documents, bank details, or free-form legal narratives. Stored sessions contain normalized non-sensitive fields only.

Shareable URLs use random opaque tokens. Public payloads do not include internal IDs.

## Limitations

This workflow supports operational decision support only. It does not predict account-specific behavior and is not legal, financial, or compliance advice.

## Non-Goals

No AI provider integration, vector database, autonomous crawler, platform blacklist, scam detector, paid subscription, enterprise workspace, SSO, automatic publishing, or universal platform ranking is part of this MVP.
