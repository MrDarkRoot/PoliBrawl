# Payment Decision Rule Dictionary

## `primary_without_backup`

Condition: usage role is `primary` and the user has no backup payout route.

Priority: `70`

Recommendation: `USE_WITH_VERIFIED_BACKUP`

Actions: `ADD_SECONDARY_PAYOUT_ROUTE`, `TEST_SMALL_WITHDRAWAL`

Evidence dependency: none; this is driven by user situation.

Limitation behavior: no confidence penalty.

Example: Vietnam bug bounty researcher using PayPal as the primary route with no tested backup.

## `fund_hold_authority`

Condition: matched risk includes `fund_hold` or `reserve`, and usage role is `primary`.

Priority: `64`

Recommendation: `USE_WITH_VERIFIED_BACKUP`

Actions: `ADD_SECONDARY_PAYOUT_ROUTE`, `PRESERVE_PAYMENT_SOURCE_RECORDS`, `EXPORT_TRANSACTION_HISTORY`

Evidence dependency: approved evidence mapped to `fund_hold` or `reserve`.

Limitation behavior: no automatic limitation.

Example: primary route with official evidence that funds may be held.

## `high_irregular_payment`

Condition: amount is `over_5000`, or amount is `500_to_5000` with `irregular` frequency.

Priority: `55`

Recommendation: `MINIMIZE_STORED_BALANCE`

Actions: `VERIFY_WITHDRAWAL_PATH`, `TEST_SMALL_WITHDRAWAL`, `PLAN_WITHDRAWAL_SCHEDULE`

Evidence dependency: none; this is driven by payment pattern.

Limitation behavior: no automatic limitation.

Example: one irregular $500-$5,000 payout from a bug bounty program.

## `additional_verification`

Condition: matched risk includes `kyc_verification` and amount is medium or high.

Priority: `75`

Recommendation: `COMPLETE_VERIFICATION_BEFORE_LARGE_PAYMENT`

Actions: `COMPLETE_IDENTITY_VERIFICATION`, `PREPARE_BUSINESS_DOCUMENTS`, `PRESERVE_PAYMENT_SOURCE_RECORDS`

Evidence dependency: approved evidence mapped to `kyc_verification`.

Limitation behavior: adds verification-readiness limitation.

Example: consultant receiving a high Deel payment where verification evidence exists.

## `withdrawal_restriction`

Condition: matched risk includes `withdrawal_restriction`.

Priority: `60`

Recommendation: `MINIMIZE_STORED_BALANCE`

Actions: `VERIFY_WITHDRAWAL_PATH`, `MINIMIZE_PLATFORM_BALANCE`, `PLAN_WITHDRAWAL_SCHEDULE`

Evidence dependency: approved evidence mapped to `withdrawal_restriction`.

Limitation behavior: no automatic limitation.

Example: platform policy evidence mentions payout or withdrawal restrictions.

## `weak_appeal_path`

Condition: appeal clarity is low, unknown, or missing.

Priority: `45`

Recommendation: `USE_WITH_VERIFIED_BACKUP`

Actions: `SAVE_SUPPORT_CORRESPONDENCE`, `EXPORT_TRANSACTION_HISTORY`

Evidence dependency: absence or weakness of appeal/support evidence.

Limitation behavior: lowers confidence and adds appeal-path limitation.

Example: account limitation evidence exists but no clear appeal route is documented.

## `country_uncertainty`

Condition: country eligibility is missing, unknown, limited, or the user selects country verification required.

Priority: `90`

Recommendation: `VERIFY_COUNTRY_ELIGIBILITY`

Actions: `VERIFY_COUNTRY_SUPPORT`, `CONFIRM_PAYER_SUPPORT`

Evidence dependency: country eligibility evidence.

Limitation behavior: lowers confidence and adds country-eligibility limitation.

Example: country-specific payout support is not verified for Vietnam.

## `payer_compatibility_uncertainty`

Condition: payer compatibility is missing, unknown, or limited.

Priority: `80`

Recommendation: `VERIFY_PAYER_COMPATIBILITY`

Actions: `CONFIRM_PAYER_SUPPORT`

Evidence dependency: payer or sender compatibility evidence.

Limitation behavior: lowers confidence and adds payer-compatibility limitation.

Example: payer or bounty program support cannot be verified from stored evidence.

## `chargeback_exposure`

Condition: commercial work type and matched risk includes `chargeback`.

Priority: `63`

Recommendation: `USE_WITH_VERIFIED_BACKUP`

Actions: `PRESERVE_INVOICES`, `PRESERVE_DELIVERY_EVIDENCE`, `PRESERVE_PAYMENT_SOURCE_RECORDS`

Evidence dependency: approved evidence mapped to `chargeback`.

Limitation behavior: no automatic limitation.

Example: indie hacker using Stripe for merchant payments with chargeback concerns.

## `primary_unclear_support`

Condition: usage role is `primary` and appeal clarity is low.

Priority: `85`

Recommendation: `AVOID_SINGLE_PLATFORM_DEPENDENCY`

Actions: `ADD_SECONDARY_PAYOUT_ROUTE`, `SAVE_SUPPORT_CORRESPONDENCE`

Evidence dependency: support or appeal clarity.

Limitation behavior: lowers confidence and adds appeal-path limitation.

Example: primary payout route where support clarity is weak.

## `backup_only_use`

Condition: usage role is `backup`, platform is reviewed, and country support is not missing.

Priority: `78`

Recommendation: `SUITABLE_AS_SECONDARY_METHOD`

Actions: `TEST_SMALL_WITHDRAWAL`, `EXPORT_TRANSACTION_HISTORY`

Evidence dependency: platform readiness and country eligibility.

Limitation behavior: increases confidence slightly.

Example: Payoneer used only as a secondary route with complete evidence.

## `high_balance_exposure`

Condition: high payment and access restriction evidence exists.

Priority: `62`

Recommendation: `MINIMIZE_STORED_BALANCE`

Actions: `PLAN_WITHDRAWAL_SCHEDULE`, `MINIMIZE_PLATFORM_BALANCE`, `EXPORT_TRANSACTION_HISTORY`

Evidence dependency: `fund_hold`, `reserve`, `withdrawal_restriction`, or `account_limitation`.

Limitation behavior: no automatic limitation.

Example: high payout on a platform with fund hold evidence.

## `incomplete_evidence`

Condition: readiness state is not `decision_ready`.

Priority: `92`

Recommendation: `FURTHER_REVIEW_REQUIRED`

Actions: `VERIFY_COUNTRY_SUPPORT`, `CONFIRM_PAYER_SUPPORT`

Evidence dependency: platform readiness evaluator.

Limitation behavior: lowers confidence and adds partial-evidence limitation.

Example: platform has some evidence but not enough reviewed coverage for the workflow.

## `verification_readiness_unknown`

Condition: payment is medium or high and personal verification readiness is unknown.

Priority: `76`

Recommendation: `COMPLETE_VERIFICATION_BEFORE_LARGE_PAYMENT`

Actions: `COMPLETE_IDENTITY_VERIFICATION`, `PREPARE_BUSINESS_DOCUMENTS`, `PRESERVE_PAYMENT_SOURCE_RECORDS`

Evidence dependency: none; the questionnaire intentionally avoids collecting identity readiness.

Limitation behavior: lowers confidence and adds verification-readiness limitation.

Example: user expects a $500-$5,000 payout but the system does not know if verification is complete.

## `no_reliable_decision`

Condition: country eligibility, payer compatibility, or withdrawal availability cannot be verified.

Priority: `100`

Recommendation: `FURTHER_REVIEW_REQUIRED`

Actions: `VERIFY_COUNTRY_SUPPORT`, `CONFIRM_PAYER_SUPPORT`, `VERIFY_WITHDRAWAL_PATH`

Evidence dependency: country, payer, and withdrawal coverage.

Limitation behavior: strongly lowers confidence and adds explicit missing-fact limitations.

Example: country support is unknown and withdrawal availability is not documented.
