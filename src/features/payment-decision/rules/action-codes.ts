import type {
  ActionCode,
  DecisionAction,
} from "@/features/payment-decision/types/payment-decision.types";

export const actionDefinitions: Record<ActionCode, DecisionAction> = {
  COMPLETE_IDENTITY_VERIFICATION: {
    code: "COMPLETE_IDENTITY_VERIFICATION",
    title: "Complete identity verification early",
    description:
      "Check the platform account for identity, address, tax, or business verification steps before the payout is initiated.",
    category: "verification",
    applicability: "Medium or high payments, irregular payouts, or platforms with KYC evidence.",
    tradeOff:
      "Verification can take time and may require documents, but doing it before funds arrive reduces interruption pressure.",
  },
  PREPARE_BUSINESS_DOCUMENTS: {
    code: "PREPARE_BUSINESS_DOCUMENTS",
    title: "Prepare business and work records",
    description:
      "Keep contracts, bounty award notices, invoices, tax profile details, and business registration records where applicable.",
    category: "records",
    applicability: "Freelancers, consultants, creators, bug bounty researchers, and indie hackers.",
  },
  PRESERVE_PAYMENT_SOURCE_RECORDS: {
    code: "PRESERVE_PAYMENT_SOURCE_RECORDS",
    title: "Preserve payment-source records",
    description:
      "Save payer identity, program terms, payout notification, invoice references, and platform messages before the transfer.",
    category: "records",
    applicability: "Any international payout where the platform may ask why funds were received.",
  },
  PRESERVE_INVOICES: {
    code: "PRESERVE_INVOICES",
    title: "Preserve invoices and payment references",
    description:
      "Store invoice PDFs, payment request IDs, acceptance notices, and settlement references outside the payout platform.",
    category: "records",
    applicability: "Commercial services, consulting, freelance work, and creator payouts.",
  },
  PRESERVE_DELIVERY_EVIDENCE: {
    code: "PRESERVE_DELIVERY_EVIDENCE",
    title: "Preserve delivery and acceptance evidence",
    description:
      "Keep work scope, delivery timestamps, acceptance messages, and final deliverables so disputes can be answered quickly.",
    category: "records",
    applicability: "Services, bug bounty submissions, creator deliverables, and merchant payments.",
  },
  VERIFY_WITHDRAWAL_PATH: {
    code: "VERIFY_WITHDRAWAL_PATH",
    title: "Verify the withdrawal path",
    description:
      "Confirm that your country, account type, bank route, currency, and withdrawal method are supported before the payout lands.",
    category: "withdrawal",
    applicability: "Primary payout routes and medium or high payments.",
  },
  TEST_SMALL_WITHDRAWAL: {
    code: "TEST_SMALL_WITHDRAWAL",
    title: "Run a small withdrawal test",
    description:
      "Receive or move a small amount first, then confirm withdrawal timing, fees, bank matching, and account status before larger funds arrive.",
    category: "withdrawal",
    applicability: "New platform accounts or first-time country/bank combinations.",
    tradeOff:
      "A test transfer may add delay or fees, but it verifies the path before the high-value payout is at risk.",
  },
  ADD_SECONDARY_PAYOUT_ROUTE: {
    code: "ADD_SECONDARY_PAYOUT_ROUTE",
    title: "Add a secondary payout route",
    description:
      "Set up another route accepted by the payer, such as a second platform, bank transfer, marketplace payout method, or contractor payroll route.",
    category: "backup",
    applicability: "Primary-use decisions and users without an existing backup route.",
    tradeOff:
      "A backup route may have higher fees or slower settlement, but it keeps payment operations from depending on one account.",
  },
  MINIMIZE_PLATFORM_BALANCE: {
    code: "MINIMIZE_PLATFORM_BALANCE",
    title: "Minimize stored balance",
    description:
      "Avoid leaving more money on the platform than needed for near-term operations once withdrawal is available.",
    category: "withdrawal",
    applicability: "Platforms with hold, reserve, withdrawal, or account limitation evidence.",
  },
  EXPORT_TRANSACTION_HISTORY: {
    code: "EXPORT_TRANSACTION_HISTORY",
    title: "Export transaction history",
    description:
      "Download statements, transaction IDs, payout records, and account notices after each meaningful payment.",
    category: "records",
    applicability: "Any route where account access or support review could interrupt records access.",
  },
  SAVE_SUPPORT_CORRESPONDENCE: {
    code: "SAVE_SUPPORT_CORRESPONDENCE",
    title: "Save support correspondence",
    description:
      "Keep support tickets, review notices, appeal messages, timestamps, and uploaded-document confirmations outside the platform.",
    category: "support",
    applicability: "Platforms with unclear appeal or support paths.",
  },
  CONFIRM_PAYER_SUPPORT: {
    code: "CONFIRM_PAYER_SUPPORT",
    title: "Confirm payer support",
    description:
      "Ask the payer whether this platform is supported for your country, work type, currency, and payout size before you commit.",
    category: "payer",
    applicability: "Bug bounty, freelance, creator, marketplace, and one-off international payments.",
  },
  VERIFY_COUNTRY_SUPPORT: {
    code: "VERIFY_COUNTRY_SUPPORT",
    title: "Verify country support",
    description:
      "Check official availability, withdrawal, and account requirements for Vietnam or your country before depending on the route.",
    category: "country",
    applicability: "Country coverage is missing, old, or not specific to the user's country.",
  },
  PLAN_WITHDRAWAL_SCHEDULE: {
    code: "PLAN_WITHDRAWAL_SCHEDULE",
    title: "Plan a withdrawal schedule",
    description:
      "Decide when funds should leave the platform, what reserve buffer stays behind, and what records are exported after withdrawal.",
    category: "withdrawal",
    applicability: "High payments or platforms with access restriction evidence.",
  },
};

export function getActionDefinition(code: ActionCode) {
  return actionDefinitions[code];
}
