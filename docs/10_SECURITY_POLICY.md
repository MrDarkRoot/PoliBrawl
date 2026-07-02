# Security Policy

This document condenses the prior root `SECURE_CODING_POLICY.md` into the baseline security rules for the Red Flag Survival MVP.

## Core Rules

- validate all external input server-side
- enforce authorization server-side
- keep public and private data separate
- do not leak unpublished or internal data
- keep the stack simple enough for a solo founder to operate safely

## Validation

- use Zod validation for route handlers, server actions, and admin forms
- validate type, length, enums, and URL shape
- reject unexpected fields
- never trust client-only validation

## Authentication and Authorization

- admin RBAC is required
- admin routes and actions must require authenticated server-side checks
- use deny-by-default authorization
- never rely on hidden form fields or frontend route hiding

## XSS Prevention

- treat user input as untrusted
- render text safely by default
- do not render raw HTML from submissions
- sanitize any future markdown pipeline before display

## SQL Injection Prevention

- use parameterized queries or safe client APIs
- never concatenate SQL with user input

## CSRF

- protect state-changing routes with cookie policy, CSRF tokens, or origin checks as appropriate
- combine public forms with rate limits and anti-bot controls

## Rate Limiting

- rate limit all public write endpoints
- rate limit login attempts
- prefer hashed IP or equivalent abuse keys over raw IP storage

## SSRF Prevention

The future source fetcher is high risk and must:
- allow only `http` and `https`
- block localhost, private IP ranges, internal hostnames, and metadata endpoints
- cap timeout, response size, and redirect depth
- never forward internal cookies or secrets

## Secrets Management

- no hardcoded secrets
- use environment variables
- keep service-role credentials out of client bundles and logs

## Safe Logging

- log security-relevant events and editorial publish actions
- do not log raw secrets, session cookies, or full sensitive submissions
- return generic user-facing errors

## Audit Trails

- store audit trails for key admin mutations
- track actor, action, entity type, entity ID, and timestamp
- do not expose audit trails publicly

## Public and Private Data Separation

- unpublished red flags, pending submissions, raw source captures, and internal notes stay private
- public pages query only explicitly published or approved records
- never fetch everything and filter client-side for visibility

## Community Safety

- no auto-publish for community submissions
- hold potentially defamatory, personal, or unsafe content for review
- publish only safe aggregates or reviewed anonymized summaries

## Final Security Standard

PoliBrawl should behave like a moderation-first editorial product, not an unsafe scraper, open complaint dump, or leaky internal dashboard.
