# Sprint 11 Migration Review

## Migration

`scripts/sql/add-payment-dependency-decision-mvp-v1.sql`

## Operations

- Creates `payment_decision_sessions` if absent.
- Creates `payment_decision_results` if absent.
- Creates indexes for platform/session lookups, token-backed result retrieval support, recommendation filtering, confidence filtering, creation time, and optional expiration.
- Uses foreign keys to existing `platforms`.
- Uses `on delete restrict` for platform references and `on delete cascade` only from a decision session to its own result rows.

## Destructive Operation Review

- `DROP TABLE`: not present.
- `DROP COLUMN`: not present.
- `DELETE`: not present.
- `UPDATE`: not present.
- `TRUNCATE`: not present.
- Destructive type changes: not present.
- Editorial or published data mutation: not present.

## Constraints

- `report_token` is `text not null unique`.
- `payment_decision_report_token_entropy_check` requires stored tokens to be at least 43 characters, preserving the 32-byte base64url token shape used by the application.
- Questionnaire fields are constrained to the supported normalized vocabulary.
- JSONB fields are constrained to expected array/object shapes.
- `recommendation_code` is constrained to the eight Sprint 11 public recommendation codes.
- `confidence_level` is constrained to `low`, `moderate`, or `high`.

## Indexes

- `idx_payment_decision_sessions_platform_id`
- `idx_payment_decision_sessions_created_at`
- `idx_payment_decision_sessions_expires_at`
- `idx_payment_decision_results_session_id`
- `idx_payment_decision_results_recommendation_code`
- `idx_payment_decision_results_confidence_level`

## Compatibility

The migration is additive and can run against an existing PoliBrawl schema without rewriting existing platform, evidence, editorial, source snapshot, research packet, or telemetry data.

## Verdict

SAFE
