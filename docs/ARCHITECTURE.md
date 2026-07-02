# Architecture

This document defines the intended technical architecture for the PoliBrawl Red Flag Survival MVP.

## Target Flow

Browser / Admin UI
↓
Next.js App Router Pages
↓
Server Actions or Route Handlers
↓
Zod Validation
↓
Authorization Guard
↓
Service Layer
↓
Repository Layer
↓
Supabase/Postgres

## Layer Rules

## App Layer

The app layer owns:
- Next.js routes
- pages
- layouts
- loading states
- error states

Rules:
- no database logic directly in components
- no business rules embedded in page JSX
- pages should orchestrate feature components, server actions, and route handlers

## Component Layer

The component layer owns:
- reusable UI primitives
- admin shell components
- feature-oriented display components

Rules:
- no direct database calls
- no service-role client usage
- client components should receive typed data and callbacks, not query the database directly

## Validation Layer

The validation layer owns:
- Zod schemas for all external input
- shared parsing for route handlers and server actions where practical

External input includes:
- admin form payloads
- route params
- search params
- public form submissions
- fetch or import requests

Rules:
- validate before service execution
- reject unexpected fields
- keep validation reusable across handlers where practical

## Auth Layer

The auth layer owns:
- admin-only CMS access
- deny-by-default authorization
- server-side route and action protection

Rules:
- admin routes and actions must be protected server-side
- do not rely on hidden UI or client checks
- do not expose admin preview URLs publicly

## Service Layer

The service layer owns business rules such as:
- candidate approval
- publish guards
- dangerous wording check
- source fetch and import
- keyword scanning

Rules:
- services compose validation results, guards, and repositories
- services enforce editorial and security rules
- services do not render UI

## Repository Layer

The repository layer owns:
- database queries only
- persistence mapping
- explicit published or private query boundaries

Rules:
- no UI logic
- no editorial copy logic
- no public/private filtering hidden on the client
- public pages must query only the rows that are already published or approved

## Database Layer

The database layer will be formalized in Epic B with `schema.polibrawl.sql`.

Rules:
- explicit publish states
- explicit moderation states
- explicit archive states
- no inferred visibility from record existence alone

## Guardrails

- Do not fetch all records then filter visibility on the client.
- Do not put Supabase service role usage in client code.
- Public pages must query only published or approved data.
- Legacy clause, rule, signal, and document concepts may remain in the codebase temporarily, but they are not the target architecture for the MVP.
