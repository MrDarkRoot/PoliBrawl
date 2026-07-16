# Payment Decision Content Operations

## Manual Workflow

Founder selects platform.

Founder reviews official source pages for payment terms, payout terms, account limits, KYC, chargebacks, country availability, and appeals.

Founder creates or updates structured risk records.

Founder attaches approved evidence with safe HTTP/HTTPS source URLs and reviewed dates.

Founder maps risks to payment decision categories.

Founder checks readiness state.

Founder validates the ten deterministic scenarios.

Founder marks the platform decision-ready only after country, payer, withdrawal, support, reviewed-date, and evidence coverage are sufficient.

## Platform Readiness Checklist

- Published platform profile exists.
- At least one active reviewed source has a safe official URL.
- At least one published payment-relevant risk exists.
- Each used risk has approved evidence.
- Reviewed date is present.
- Jurisdiction or country support is documented, or country verification is explicitly required.
- Confidence limitations are known.
- At least one preparation action applies.

## Source Review Rules

Use public official sources first. Do not rely on scanner metadata, source snapshot IDs, raw crawler output, AI drafts, admin notes, or unreviewed research packets.

Do not publish unsupported platform recommendations. Partial evidence should remain partial and lower confidence.

## Corrections

Correction submissions stay pending for founder review. They may indicate outdated evidence, broken official links, incorrect country assumptions, missing payout restrictions, or unclear recommendations.

Corrections do not automatically update public reports.

## Production Guard

Development/test fixtures must not be run as production seed data. Production readiness must come from reviewed records in the database.
