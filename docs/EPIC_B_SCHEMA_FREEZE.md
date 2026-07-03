# Epic B Schema Freeze

This document serves as the stable CMS schema contract before building public delivery layers (Sprint 7). 

## 1. Frozen Table List

| Table Name | Purpose | Classification | Relationships | Archival / Status |
|---|---|---|---|---|
| `platforms` | Tracks platform subjects (e.g. Uber, Doordash) | Private/Public | Has many `sources`, `red_flags` | `status` (archived), `archived_at` |
| `sources` | The policy source documents | Private | Belongs to `platforms` | `status`, `archived_at` |
| `source_snapshots` | Versioned captures of a source | Private | Belongs to `sources` | `status` |
| `keyword_matches` | Traceability layer for scanner hits | Private | Belongs to `source_snapshots` | None (immutable log) |
| `red_flag_candidates` | Machine-generated potential issues | Private | Belongs to `source_snapshots`, `keyword_matches` | `status`, `archived_at` |
| `candidate_review_history` | Audit log of decisions on candidates | Private | Belongs to `red_flag_candidates` | None (immutable log) |
| `red_flags` | Editorial workspace for platform issues | Private (until published) | Belongs to `platforms`, `sources` | `status`, `archived_at` |
| `evidence` | Proof for a red flag | Private | Belongs to `red_flags` | `status`, `archived_at` |
| `survival_notes` | How to survive the red flag | Private | Belongs to `red_flags` | `status`, `archived_at` |
| `backup_options` | Contingency plans | Private | Belongs to `red_flags` | `status`, `archived_at` |
| `checklists` | Actionable checklist for a red flag | Private | Belongs to `red_flags` | `status`, `archived_at` |
| `checklist_items` | Individual checklist items | Private | Belongs to `checklists` | `status`, `archived_at` |
| `platform_survival_pages` | Composed platform survival page drafts | Private (until published) | Belongs to `platforms` | `status`, `archived_at`, `ready_for_publish` |
| `platform_survival_page_red_flags` | Join table for page red flag ordering | Private | Belongs to `platform_survival_pages`, `red_flags` | None |
| `review_requests` | Formal editorial review loops | Private | Generic entity attachment | `status`, `archived_at` |
| `platform_watchers` | Users watching a platform (community) | Private | Belongs to `platforms` | `unsubscribed_at` |
| `experience_submissions` | Community submitted experiences | Private | Belongs to `platforms` | `status`, `archived_at` |
| `survival_tip_submissions` | Community submitted tips | Private | Belongs to `platforms` | `status`, `archived_at` |
| `corrections` | Community submitted corrections | Private | Belongs to `platforms` / `red_flags` | `status`, `archived_at` |

## 2. Relationship Flow

**Core Pipeline Flow:**

Platform
↓
Source
↓
Source Snapshot
↓
Keyword Match
↓
Red Flag Candidate
↓
Candidate Review History
↓
Draft Red Flag
↓
Evidence / Survival Notes / Backup Options / Checklist
↓
Platform Survival Page
↓
Platform Survival Page Red Flags

**Community Intake Structure:**
(Operates independently as structured inputs into the editorial system, private by default)
- Platform ← Platform Watchers
- Platform ← Experience Submissions
- Platform ← Survival Tip Submissions
- Platform / Red Flag ← Corrections

## 3. Contract Rules

* **Policy Ingestion**: Policy/source content enters through `sources` and `source_snapshots`.
* **Traceability**: Keyword scanner writes `keyword_matches` which directly reference snapshots.
* **Candidate Generation**: Scanner may create `red_flag_candidates` bounded by matches.
* **Editorial Origin**: Human review of candidates creates draft `red_flags`.
* **Quality Gate**: Draft `red_flags` become ready only through quality evaluation (requiring evidence, notes, checklists).
* **Composition Layer**: Platform survival pages compose ready red_flags.
* **Publishing Contract**: Platform survival pages are **not** public until a future publisher layer handles them.
* **Privacy by Default**: Public layers must read only published/ready snapshots or explicit public views. Internal raw source snapshots are private. Community submissions are pending/private by default.
* **Data Safety**: No hard deletes in editorial flows; use archive timestamps and status fields exclusively.
* **Scope**: No public publishing in Epic B.
