# Sprint 11 Scenario Validation

Validation date: 2026-07-16

Scope: deterministic fixtures and isolated QA database route checks. The matrix below records rule-engine behavior; it does not assert real platform policy facts.

## Scenario Matrix

| # | Scenario | Recommendation | Confidence | Main rule | Main limitation |
|---|---|---|---|---|---|
| 1 | Vietnam bug bounty researcher, PayPal, 500-5000 USD, irregular, primary, no backup | `AVOID_SINGLE_PLATFORM_DEPENDENCY` | high | `primary_unclear_support` | Appeal or support path clarity is low or not documented. |
| 2 | Vietnam freelancer, Wise, regular, primary, existing backup | `COMPLETE_VERIFICATION_BEFORE_LARGE_PAYMENT` | high | `verification_readiness_unknown` | The questionnaire does not collect identity-document readiness, so verification readiness is unknown. |
| 3 | Creator, Payoneer, irregular, backup use | `SUITABLE_AS_SECONDARY_METHOD` | high | `backup_only_use` | The questionnaire does not collect identity-document readiness, so verification readiness is unknown. |
| 4 | Indie hacker, Stripe, regular merchant payments, chargeback concern | `USE_WITH_VERIFIED_BACKUP` | high | `chargeback_exposure` | none |
| 5 | Consultant, Deel, one-time high payment, verification concern | `COMPLETE_VERIFICATION_BEFORE_LARGE_PAYMENT` | high | `verification_readiness_unknown` | The questionnaire does not collect identity-document readiness, so verification readiness is unknown. |
| 6 | Unsupported or unknown country support | `FURTHER_REVIEW_REQUIRED` | low | `no_reliable_decision` | Country eligibility or withdrawal support is not verified for this situation. |
| 7 | High payment with unclear withdrawal path | `FURTHER_REVIEW_REQUIRED` | low | `no_reliable_decision` | Withdrawal availability is not verified from the stored public evidence. |
| 8 | Backup-only use with complete evidence | `SUITABLE_AS_SECONDARY_METHOD` | high | `backup_only_use` | The questionnaire does not collect identity-document readiness, so verification readiness is unknown. |
| 9 | Platform with partial evidence | `FURTHER_REVIEW_REQUIRED` | low | `incomplete_evidence` | The platform profile is not fully decision-ready for this workflow. |
| 10 | Wise versus PayPal comparison | Primary fit: Wise has stronger evidence gate where country, payer, and withdrawal support are confirmed. Backup fit: either platform only after payer support and withdrawal testing. | mixed | comparison trade-off engine | Payer compatibility is not fully verified for at least one route. |

## Recommendation Distribution

- `FURTHER_REVIEW_REQUIRED`: 3
- `COMPLETE_VERIFICATION_BEFORE_LARGE_PAYMENT`: 2
- `SUITABLE_AS_SECONDARY_METHOD`: 2
- `AVOID_SINGLE_PLATFORM_DEPENDENCY`: 1
- `USE_WITH_VERIFIED_BACKUP`: 1

## Quality Gate

Pass.

Recommendation collapse was not observed after priority tuning. The scenarios produce distinct outputs for primary no-backup risk, high/medium verification readiness, backup-only use, chargeback exposure, incomplete evidence, country uncertainty, and unclear withdrawal support.

## Comparison Gate

Pass.

The comparison output describes primary-use fit, backup-use fit, and unresolved trade-offs. It does not claim a universally safest platform.

## Limitations

- Fixture evidence is deterministic and intentionally does not represent real policy facts.
- Country-specific and payer-specific claims still require reviewed production evidence before live recommendations should be treated as decision-ready.
- The verification-readiness limitation appears in several medium/high and backup scenarios because the questionnaire intentionally avoids collecting personal identity-document readiness.
