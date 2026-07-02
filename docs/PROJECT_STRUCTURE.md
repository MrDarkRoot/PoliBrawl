# Project Structure

This document defines the target file and folder convention for Epic B.

```text
src/
  app/
    admin/
      platforms/
      sources/
      candidates/
      red-flags/
      community/
      publisher/
    api/
      admin/
      public/
  components/
    ui/
    layout/
    admin/
    polibrawl/
  features/
    platforms/
      components/
      actions/
      schemas/
    sources/
      components/
      actions/
      schemas/
    candidates/
      components/
      actions/
      schemas/
    red-flags/
      components/
      actions/
      schemas/
    evidence/
      components/
      actions/
      schemas/
    survival-notes/
      components/
      actions/
      schemas/
    backup-options/
      components/
      actions/
      schemas/
    checklists/
      components/
      actions/
      schemas/
    community/
      components/
      actions/
      schemas/
    publisher/
      components/
      actions/
      schemas/
  server/
    polibrawl/
      repositories/
      services/
      guards/
      audit/
  lib/
    polibrawl/
    supabase/
    security/
    utils/
  types/
    polibrawl.ts
```

## Ownership Rules

## `components/ui`

Purpose:
- generic shadcn/ui or low-level visual primitives

Rules:
- no product-specific business logic
- no repository imports

## `components/layout`

Purpose:
- top-level shells
- headers
- sidebars
- content frames

Rules:
- reusable across admin and future public surfaces where appropriate

## `components/admin`

Purpose:
- reusable admin shell UI
- filters
- panels
- badges
- dashboard widgets

Rules:
- presentation only
- no direct repository access

## `components/polibrawl`

Purpose:
- reusable PoliBrawl-specific display blocks such as red flag cards or evidence blocks

Rules:
- shared product UI only
- keep admin-only variants separate if behavior differs

## `features/*`

Purpose:
- own feature-specific UI, schemas, and actions

Each feature folder may contain:
- `components/`
- `actions/`
- `schemas/`

Rules:
- feature modules should gather their UI and input logic in one place
- actions should coordinate validation and service calls
- schemas should define feature input and form shapes

## `server/polibrawl/repositories`

Purpose:
- database query functions

Rules:
- repositories own DB access only
- repositories do not know about UI
- repositories should make visibility and status filters explicit

## `server/polibrawl/services`

Purpose:
- business logic
- publish rules
- workflow transitions
- scanner behavior

Rules:
- services may call multiple repositories
- services may enforce editorial and security constraints
- services should not return UI components

## `server/polibrawl/guards`

Purpose:
- admin guard helpers
- authorization checks
- publish guards

## `server/polibrawl/audit`

Purpose:
- audit log helpers
- action event definitions

## `lib/polibrawl`

Purpose:
- product constants
- small pure helpers
- shared mappings

## `lib/supabase`

Purpose:
- Supabase client setup for server and browser contexts

Rules:
- service-role usage must remain server-only

## `lib/security`

Purpose:
- security helpers
- SSRF checks
- dangerous wording checks
- rate-limit utilities if needed

## `lib/utils`

Purpose:
- generic utility helpers not specific to one feature

## `types/polibrawl.ts`

Purpose:
- shared product-facing types
- status unions
- DTOs if needed

## Import Boundaries

- client components must not import server repositories
- admin pages may compose feature components and server actions
- public pages later must not import admin-only components
- repositories should not import React components
- UI should depend on typed data contracts, not direct database clients
