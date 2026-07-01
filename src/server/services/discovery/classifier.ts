import { documentTypes } from "@/lib/constants";

type Classification = {
  documentType: (typeof documentTypes)[number];
  sourceTier: "tier_1_core" | "tier_2_supporting" | "tier_3_context" | "tier_4_ignore";
  confidence: number;
};

const pathRules: Array<{ match: RegExp; result: Classification }> = [
  {
    match: /privacy/i,
    result: {
      documentType: "privacy_policy",
      sourceTier: "tier_1_core",
      confidence: 0.92,
    },
  },
  {
    match: /terms|user-agreement|service-terms/i,
    result: {
      documentType: "terms_of_service",
      sourceTier: "tier_1_core",
      confidence: 0.9,
    },
  },
  {
    match: /fees|pricing/i,
    result: {
      documentType: "fees_page",
      sourceTier: "tier_2_supporting",
      confidence: 0.82,
    },
  },
  {
    match: /refund/i,
    result: {
      documentType: "refund_policy",
      sourceTier: "tier_2_supporting",
      confidence: 0.82,
    },
  },
  {
    match: /developer|api/i,
    result: {
      documentType: "developer_terms",
      sourceTier: "tier_2_supporting",
      confidence: 0.78,
    },
  },
  {
    match: /legal|compliance/i,
    result: {
      documentType: "legal_hub",
      sourceTier: "tier_1_core",
      confidence: 0.75,
    },
  },
  {
    match: /faq|help/i,
    result: {
      documentType: "help_center_article",
      sourceTier: "tier_3_context",
      confidence: 0.6,
    },
  },
];

export function classifyCandidate(input: {
  url: string;
  title?: string | null;
  contextText?: string | null;
}) {
  const haystack = [input.url, input.title, input.contextText].filter(Boolean).join(" ");

  for (const rule of pathRules) {
    if (rule.match.test(haystack)) {
      return rule.result;
    }
  }

  return {
    documentType: "other" as const,
    sourceTier: "tier_3_context" as const,
    confidence: 0.45,
  };
}
