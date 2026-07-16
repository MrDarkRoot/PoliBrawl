# Policy Intelligence Roadmap

## Product rationale

PoliBrawl already explains platform dependency risk. Sprint 9 adds the retention layer needed to make the product operational over time:

- detect meaningful policy changes
- surface those changes publicly with editorial structure
- let signed-in users follow platforms
- give users a personal dashboard for recent changes and alerts

The goal is not generic news. The goal is operational decision support tied to official platform evidence.

## Architecture

### New data flow

Official source -> snapshot -> change review -> policy change record -> public radar -> user watchlist -> dashboard alerts

This sits beside the existing survival-guide pipeline. It does not replace red flags or survival pages.

### Layer boundaries

- Layer A: published policy changes remain factual, evidence-first, and operational
- Layer B: watchlist, dashboard, and alerts increase retention and product value
- Layer C: no story or community content is mixed into policy change records

## Schema additions

### `policy_changes`

Purpose: store reviewed policy deltas that can become public intelligence.

Primary Sprint 9 fields:

- `platform_id`
- `source_id`
- `old_snapshot_id`
- `new_snapshot_id`
- `change_type`
- `summary`
- `impact_level`
- `published_status`
- `what_changed`
- `who_is_affected`
- `why_it_matters`
- `what_to_do`
- `created_at`
- `reviewed_at`
- `published_at`

Compatibility fields are also retained so the older versioning pipeline can continue writing draft change records without breaking.

### `user_platform_watchlist`

Purpose: user follows a platform for future alerts.

Fields:

- `user_id`
- `platform_id`
- `created_at`

Rules:

- authenticated users only
- one follow per user/platform pair
- no public exposure of user identifiers

### `policy_alerts`

Purpose: user-visible alert records for published policy changes.

Fields:

- `user_id`
- `policy_change_id`
- `status`
- `created_at`
- `read_at`

Rules:

- unread/read only
- one alert per user/change pair

## Publication rules

Published policy changes must include:

1. `summary`
2. `what_changed`
3. `who_is_affected`
4. `why_it_matters`
5. `what_to_do`
6. official source linkage
7. old and new snapshot linkage

Do not publish:

- placeholder wording
- generic copy
- unsupported certainty
- scanner metadata
- internal snapshot identifiers

## Runtime surfaces

- Public index: `/changes`
- Public detail: `/changes/[id]`
- User dashboard: `/dashboard`
- Watchlist actions: platform page and dashboard

## Security model

- dashboard and watchlist require an authenticated profile
- dashboard queries are always scoped to the signed-in user
- public routes expose only published records
- public serializers remove internal metadata and snapshot ids
- schema changes remain additive

## Rollout notes

1. apply canonical schema plus additive migration
2. seed reviewed policy changes through editorial operations
3. validate public radar pages before linking them broadly
4. monitor alert creation volume before adding email or push delivery

## Future roadmap

Likely next steps after Sprint 9:

1. admin/editor workflow for policy change review and publish
2. automated snapshot diff summaries for editors
3. email or in-product notification delivery
4. platform comparison views based on recent change frequency
5. user stack personalization across multiple platform dependencies
