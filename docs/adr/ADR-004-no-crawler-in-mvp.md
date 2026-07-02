# ADR-004: No Crawler In MVP

## Status

Accepted

## Context

The founder needs a bounded, maintainable workflow. The MVP scope explicitly excludes a full crawler and prioritizes a small source registry with manual review.

## Decision

MVP uses bounded source registry, fetch/paste, and keyword scanner, not broad autonomous crawling.

## Consequences

- source intake starts with manual registry entries
- source capture supports fetch URL and paste text
- keyword scanning is bounded to captured source text
- do not build crawler scheduling, link expansion, or autonomous discovery as part of Epic B
