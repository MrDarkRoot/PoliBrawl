# Project Context

## Product Pivot

PoliBrawl is pivoting from an older legal-document intelligence pipeline to a Platform Red Flag Survival Intelligence product.

Policy is the source.
Red Flag is the product.

The old repo is still valuable because it already contains a working Next.js and Supabase-style scaffold, admin structure, and data-flow patterns. That scaffold should be reused where practical, but the old domain model should be archived, not expanded.

## Founder Constraints

- Solo founder.
- Low budget.
- Side project while the founder continues bug bounty work full-time.
- Limited operating capacity for moderation, support, and editorial cleanup.

## Execution Constraints

- Avoid overbuilding.
- Prefer practical MVP workflows over ambitious automation.
- Reuse the existing scaffold where it reduces build time.
- Keep editorial operations solo-founder-operable.
- Treat heavy AI, full crawling, and complex document analysis as future or optional.

## Business Priorities

Near-term priorities:
- practical MVP
- SEO-driven distribution
- useful survival pages
- structured community signals

Later priorities:
- paid reports
- supporter revenue
- deeper operational tooling once the core loop works

## Architecture Direction

The repo contains legacy concepts such as legal documents, clauses, rules, and signals. Those concepts may map loosely to new editorial workflow pieces, but they are no longer the public product language.

The new public and internal language should center on:
- platforms
- sources
- red flags
- evidence
- survival notes
- backup options
- checklists
- community signals

## Anti-Overbuild Rule

If a feature does not clearly help the founder publish and maintain useful platform survival pages, it is probably too early.
