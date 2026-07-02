# PoliBrawl Documentation

This folder is the canonical documentation set for the PoliBrawl pivot to the Red Flag Survival MVP.

PoliBrawl is now an evidence-first survival guide and community signal board for platform-dependent workers. The repo still contains useful legacy scaffold and old pipeline code, but that legacy architecture is not the product direction.

Warning:
Do not continue the old legal-document / clause / signal pipeline architecture.

## Reading Order

1. [00_PROJECT_CONTEXT.md](00_PROJECT_CONTEXT.md)
2. [01_PRODUCT_OVERVIEW.md](01_PRODUCT_OVERVIEW.md)
3. [02_MVP_SCOPE.md](02_MVP_SCOPE.md)
4. [ARCHITECTURE.md](ARCHITECTURE.md)
5. [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
6. [STATE_MACHINE.md](STATE_MACHINE.md)
7. [NAMING_CONVENTION.md](NAMING_CONVENTION.md)
8. [04_DATA_MODEL.md](04_DATA_MODEL.md)
9. [05_INTERNAL_CMS_PRD.md](05_INTERNAL_CMS_PRD.md)
10. [06_PIPELINE_SPEC.md](06_PIPELINE_SPEC.md)
11. [09_EDITORIAL_SAFETY.md](09_EDITORIAL_SAFETY.md)
12. [10_SECURITY_POLICY.md](10_SECURITY_POLICY.md)
13. [12_EPIC_B_INTERNAL_CMS_PLAN.md](12_EPIC_B_INTERNAL_CMS_PLAN.md)

## Document Map

- [EPIC_B_SCHEMA_FREEZE.md](EPIC_B_SCHEMA_FREEZE.md): The stable Epic B schema contract (frozen before Sprint 7).

- [00_PROJECT_CONTEXT.md](00_PROJECT_CONTEXT.md): founder constraints, pivot context, and anti-overbuilding rules.
- [01_PRODUCT_OVERVIEW.md](01_PRODUCT_OVERVIEW.md): product definition, target users, product unit, and page anatomy.
- [02_MVP_SCOPE.md](02_MVP_SCOPE.md): strict MVP freeze for what is in and out.
- [03_PRODUCT_PRINCIPLES.md](03_PRODUCT_PRINCIPLES.md): working principles for product and editorial choices.
- [04_DATA_MODEL.md](04_DATA_MODEL.md): MVP entities and publishing rules.
- [05_INTERNAL_CMS_PRD.md](05_INTERNAL_CMS_PRD.md): product requirements for Epic B internal tooling.
- [06_PIPELINE_SPEC.md](06_PIPELINE_SPEC.md): operator pipeline and keyword taxonomy.
- [07_PUBLIC_SITE_PRD.md](07_PUBLIC_SITE_PRD.md): public site requirements for Epic C.
- [08_COMMUNITY_SIGNALS.md](08_COMMUNITY_SIGNALS.md): structured signal intake and aggregation rules.
- [09_EDITORIAL_SAFETY.md](09_EDITORIAL_SAFETY.md): editorial safety, trademark, disclaimer, and moderation policy.
- [10_SECURITY_POLICY.md](10_SECURITY_POLICY.md): application security rules for the future CMS and public forms.
- [11_ROADMAP.md](11_ROADMAP.md): roadmap by epic.
- [12_EPIC_B_INTERNAL_CMS_PLAN.md](12_EPIC_B_INTERNAL_CMS_PLAN.md): implementation plan for the next Codex build task.

## Technical Skeleton

- [ARCHITECTURE.md](ARCHITECTURE.md): intended application layering and server-side boundaries.
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md): target folder ownership and import boundaries for Epic B.
- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md): core UI primitives and safety requirements.
- [NAVIGATION.md](NAVIGATION.md): admin and future public navigation model.
- [STATE_MACHINE.md](STATE_MACHINE.md): status values, transitions, and publish guards.
- [NAMING_CONVENTION.md](NAMING_CONVENTION.md): naming rules for DB, TypeScript, routes, and UI copy.
- [adr/](adr/): architecture decision records for the PoliBrawl MVP.

## Legacy Note

The old schema, routes, and services were built around policy documents, clauses, rules, and signals. Those assets may still be useful as implementation reference or scaffold, but they should be treated as legacy inputs to archive or adapt, not as the active product model.
