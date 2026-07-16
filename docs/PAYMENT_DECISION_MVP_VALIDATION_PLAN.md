# Payment Decision MVP Validation Plan

## Four-Week Goal

Validate whether independent online workers use a short evidence-based payment dependency report before receiving international payouts.

## Five-Platform Readiness Checklist

- PayPal readiness state reviewed.
- Wise readiness state reviewed.
- Payoneer readiness state reviewed.
- Stripe readiness state reviewed.
- Deel readiness state reviewed.

Each platform must be labeled `decision_ready`, `partial_evidence`, `country_verification_required`, or `not_reviewed`.

## Ten Manual Scenarios

1. Vietnam bug bounty researcher, PayPal, $500-$5,000, irregular, primary, no backup.
2. Vietnam freelancer, Wise, regular payments, primary, existing PayPal backup.
3. Creator, Payoneer, irregular, backup use.
4. Indie hacker, Stripe, regular merchant payments, chargeback concern.
5. Consultant, Deel, one-time high payment, verification concern.
6. Unknown country support.
7. High payment and unclear withdrawal path.
8. Backup-only use with complete evidence.
9. Platform with partial evidence.
10. Two-platform comparison.

## Report Review Checklist

- Recommendation code avoids safe/unsafe language.
- Why section ties to user input, matched rule, or matched evidence.
- Main risks include source and reviewed date.
- Checklist contains concrete actions.
- Backup plan covers limitation, withdrawal delay, KYC request, and unavailable route.
- Confidence explains missing facts.
- Public payload has no internal IDs.

## Interview Questions

- What payout route were you considering before reading this?
- Which report section changed your next action?
- Was any checklist item immediately useful?
- Did the backup plan feel realistic for your payer?
- What evidence was missing for your country or payer?
- Would you share this report with a payer, teammate, or friend?

## Behavior Signals

- Questionnaire completed.
- Report generated.
- Checklist copied.
- Report link copied.
- Comparison started.
- Correction submitted.
- User reports setting up a backup route before payout.

## One-Off Payment Experiment

Recruit five Vietnam-based bug bounty researchers or freelancers expecting an international payout. Ask each to run one platform check before selecting or accepting a payout route. Record whether they changed preparation behavior within seven days.

## Kill Criteria

- Users do not understand the recommendation.
- Users want a generic policy summary instead of a decision report.
- Users do not take any preparation action.
- Evidence maintenance takes more time than a solo founder can sustain.
- Country/payer uncertainty dominates every report and prevents usefulness.

## Narrowing Criteria

- Focus only on bug bounty payouts if freelancers are too broad.
- Focus only on PayPal and Wise if five-platform evidence is too thin.
- Focus only on Vietnam if country coverage becomes the main blocker.
