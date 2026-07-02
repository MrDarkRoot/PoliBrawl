# Design System

This document defines the base UI primitives for PoliBrawl.

## Visual Tone

- independent editorial intelligence
- dark editorial dashboard acceptable
- calm, evidence-first, not hate-site
- no official SaaS logos
- platform names text-only
- use generic category icons

## Global Safety Rules

- do not use official brand logos or official brand colors
- do not use inflammatory wording
- do not render untrusted HTML
- keep public evidence excerpts short and source-linked

## Core Components

## PlatformCard

Purpose:
- summary card for one platform in admin or public listings

Required fields:
- platform name
- category
- status or review state
- last reviewed date when available

Safety requirements:
- text-only platform naming
- no official logo use
- no misleading partnership cues

## PlatformHeader

Purpose:
- primary header for a platform detail or survival page

Required fields:
- platform name
- category
- short summary
- disclaimer anchor or reviewed metadata

Safety requirements:
- disclaimer must remain easy to reach
- do not imply endorsement

## RedFlagCard

Purpose:
- show one reviewed red flag clearly

Required fields:
- title
- category
- level
- summary
- why it matters
- reviewed date
- evidence link or anchor

Safety requirements:
- must not publish without evidence linkage
- wording must remain neutral
- no sensational copy

## EvidenceBlock

Purpose:
- show source-backed proof for a red flag

Required fields:
- short excerpt
- source name
- source URL
- reviewed date

Safety requirements:
- no full-page mirroring
- no untrusted HTML rendering
- no oversized copyrighted blocks

## SurvivalNoteCard

Purpose:
- show practical advice tied to a red flag or platform

Required fields:
- note title
- note body
- optional priority label

Safety requirements:
- no legal-advice framing
- keep content actionable and calm

## BackupOptionCard

Purpose:
- show a fallback platform or strategy

Required fields:
- option label
- summary
- tradeoff

Safety requirements:
- tradeoff is mandatory
- no hidden sponsorship
- no absolute endorsement language

## ChecklistBlock

Purpose:
- show ordered survival actions

Required fields:
- checklist title
- checklist items

Safety requirements:
- items should be practical and not misleading
- no hidden unpublished admin notes

## CommunitySignalsBlock

Purpose:
- show safe aggregate community demand and experience data

Required fields:
- request review count
- watcher count
- approved aggregate counts or approved tip count

Safety requirements:
- no raw accusations
- no pending submission text
- no forum-like thread presentation

## AdminQueueTable

Purpose:
- tabular review surface for candidates or submissions

Required fields:
- entity label
- status
- source or platform reference
- updated timestamp

Safety requirements:
- admin-only
- should not expose hidden sensitive fields by default

## AdminReviewCard

Purpose:
- review panel for one candidate, correction, or submission

Required fields:
- title or subject
- source context
- status
- reviewer actions

Safety requirements:
- admin-only
- dangerous wording and privacy issues should be visible before approval

## PublisherPreviewPanel

Purpose:
- preview readiness and missing pieces before publish

Required fields:
- section completeness summary
- warnings
- publish readiness state

Safety requirements:
- admin-only
- must surface evidence and disclaimer gaps

## SafetyWarningBanner

Purpose:
- highlight issues that block or complicate publication

Required fields:
- warning title
- warning detail
- severity or block state

Safety requirements:
- should appear for dangerous wording, missing evidence, stale review dates, or archived platform dependencies

## EmptyState

Purpose:
- clear message when a list or section has no items

Required fields:
- title
- short explanation
- optional next action

Safety requirements:
- do not present missing data as safe or complete

## LoadingState

Purpose:
- consistent loading UI

Required fields:
- loading label

Safety requirements:
- avoid misleading placeholder values that look like real evidence

## ErrorState

Purpose:
- consistent error UI

Required fields:
- user-safe message
- optional retry action

Safety requirements:
- do not leak internal errors, stack traces, or private identifiers
