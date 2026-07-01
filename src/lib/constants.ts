export const platformCategories = [
  "payment",
  "creator_freelance",
  "saas_vendor",
] as const;

export const platformStatuses = [
  "draft",
  "active",
  "archived",
  "needs_review",
] as const;

export const sourceCandidateStatuses = [
  "pending",
  "approved",
  "rejected",
  "needs_manual_review",
] as const;

export const sourceStatuses = [
  "active",
  "unreachable",
  "redirected",
  "changed",
  "deprecated",
  "needs_review",
  "ignored",
] as const;

export const sourceTiers = [
  "tier_1_core",
  "tier_2_supporting",
  "tier_3_context",
  "tier_4_ignore",
] as const;

export const documentTypes = [
  "terms_of_service",
  "user_agreement",
  "privacy_policy",
  "acceptable_use_policy",
  "payment_terms",
  "payout_policy",
  "refund_policy",
  "fees_page",
  "developer_terms",
  "api_terms",
  "data_processing_addendum",
  "security_policy",
  "service_terms",
  "billing_terms",
  "help_center_article",
  "faq_article",
  "complaints_policy",
  "dispute_policy",
  "seller_protection_policy",
  "buyer_protection_policy",
  "chargeback_policy",
  "policy_updates",
  "legal_hub",
  "status_policy",
  "corporate_position",
  "transparency_report",
  "trust_center_page",
  "public_policy_statement",
  "blog_context",
  "press_release_context",
  "marketing_page",
  "generic_blog_post",
  "newsroom_article",
  "career_page",
  "investor_page",
  "campaign_page",
  "landing_page",
  "other",
] as const;

export const signalCategories = [
  "money_control",
  "payout_control",
  "account_control",
  "kyc_verification",
  "appeal_clarity",
  "data_control",
  "billing_control",
  "business_continuity",
  "transparency",
  "api_developer_dependency",
  "content_monetization_control",
] as const;

export const signalLevels = [
  "low",
  "medium",
  "high",
  "very_high",
  "unknown",
] as const;

export const signalConfidenceLevels = ["low", "medium", "high"] as const;

export const evidenceVisibilityLevels = ["public", "internal", "hidden"] as const;
export const evidenceStatuses = ["draft", "approved", "published", "archived"] as const;
export const adminWritableRoles = ["editor", "admin", "owner"] as const;
