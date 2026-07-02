# ADR-001: Red Flag Core Entity

## Status

Accepted

## Context

The repo contains older legal-document pipeline concepts such as documents, clauses, rules, and signals. The PoliBrawl pivot changes the product from document intelligence to survival intelligence for platform-dependent workers.

## Decision

Red Flag is the core product entity, not policy document, clause, rule, or signal.

## Consequences

- product UI should center on red flags
- internal CMS workflows should promote candidate findings into red flags
- policy text remains a source input, not the product itself
- legacy domain terms may remain temporarily in old code, but new code should use the red flag model
