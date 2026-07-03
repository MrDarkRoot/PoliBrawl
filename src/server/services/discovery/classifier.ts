import { documentTypes } from "@/lib/constants";

type DocumentType = (typeof documentTypes)[number];
type SourceTier =
  | "tier_1_core"
  | "tier_2_supporting"
  | "tier_3_context"
  | "tier_4_ignore";

export type UrlClassification = {
  documentType: DocumentType;
  sourceTier: SourceTier;
  confidence: number;
  reasons: string[];
};

const urlRules: Array<{
  match: RegExp;
  documentType: DocumentType;
  sourceTier: SourceTier;
  confidence: number;
  reasons: string[];
}> = [
  {
    match: /privacy(?:-policy|-notice|-notices)?/i,
    documentType: "privacy_policy",
    sourceTier: "tier_1_core",
    confidence: 0.94,
    reasons: ["url or title contains privacy signals"],
  },
  {
    match: /acceptable[-\s]?use|\/aup\b/i,
    documentType: "acceptable_use_policy",
    sourceTier: "tier_1_core",
    confidence: 0.93,
    reasons: ["url or title contains acceptable use signals"],
  },
  {
    match: /terms(?:-and-conditions|-of-use)?|user-agreement|agreement/i,
    documentType: "terms_of_service",
    sourceTier: "tier_1_core",
    confidence: 0.92,
    reasons: ["url or title contains terms or agreement signals"],
  },
  {
    match: /dpa|data-processing|processor|subprocessor/i,
    documentType: "data_processing_addendum",
    sourceTier: "tier_1_core",
    confidence: 0.9,
    reasons: ["url or title contains DPA signals"],
  },
  {
    match: /security|trust/i,
    documentType: "security_policy",
    sourceTier: "tier_2_supporting",
    confidence: 0.82,
    reasons: ["url or title contains security signals"],
  },
  {
    match: /fees|pricing/i,
    documentType: "fees_page",
    sourceTier: "tier_2_supporting",
    confidence: 0.82,
    reasons: ["url or title contains fees or pricing signals"],
  },
  {
    match: /refund|complaint|complaints|dispute/i,
    documentType: "dispute_policy",
    sourceTier: "tier_2_supporting",
    confidence: 0.8,
    reasons: ["url or title contains dispute or complaints signals"],
  },
  {
    match: /payout|payment|chargeback|reserve|withdrawal/i,
    documentType: "payment_terms",
    sourceTier: "tier_2_supporting",
    confidence: 0.78,
    reasons: ["url or title contains payments signals"],
  },
  {
    match: /developer|api/i,
    documentType: "api_terms",
    sourceTier: "tier_2_supporting",
    confidence: 0.76,
    reasons: ["url or title contains developer or API signals"],
  },
  {
    match: /policy-updates/i,
    documentType: "policy_updates",
    sourceTier: "tier_2_supporting",
    confidence: 0.75,
    reasons: ["url or title contains policy updates signals"],
  },
  {
    match: /legal/i,
    documentType: "legal_hub",
    sourceTier: "tier_1_core",
    confidence: 0.74,
    reasons: ["url or title contains legal signals"],
  },
  {
    match: /help|faq|article/i,
    documentType: "help_center_article",
    sourceTier: "tier_3_context",
    confidence: 0.58,
    reasons: ["url or title contains help center signals"],
  },
  {
    match: /blog|news|newsroom|press/i,
    documentType: "blog_context",
    sourceTier: "tier_4_ignore",
    confidence: 0.57,
    reasons: ["url or title contains blog or newsroom signals"],
  },
];

export function classifyCandidate(input: {
  url: string;
  title?: string | null;
  contextText?: string | null;
}) {
  const haystack = [input.url, input.title, input.contextText].filter(Boolean).join(" ");

  for (const rule of urlRules) {
    if (rule.match.test(haystack)) {
      return {
        documentType: rule.documentType,
        sourceTier: rule.sourceTier,
        confidence: rule.confidence,
        reasons: rule.reasons,
      } satisfies UrlClassification;
    }
  }

  return {
    documentType: "other" as const,
    sourceTier: "tier_3_context" as const,
    confidence: 0.45,
    reasons: ["no strong url or title signals matched"],
  } satisfies UrlClassification;
}
