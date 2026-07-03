import { documentTypes } from "@/lib/constants";

type DocumentType = (typeof documentTypes)[number];
type SourceTier =
  | "tier_1_core"
  | "tier_2_supporting"
  | "tier_3_context"
  | "tier_4_ignore";

export type ContentClassification = {
  documentType: DocumentType;
  sourceTier: SourceTier;
  useForScoring: boolean;
  monitorEnabled: boolean;
  confidence: number;
  classificationReasons: string[];
};

type RuleDefinition = {
  documentType: DocumentType;
  sourceTier: SourceTier;
  useForScoring: boolean;
  monitorEnabled: boolean;
  baseScore: number;
  titleUrlPatterns: Array<string | RegExp>;
  contentPatterns: string[];
};

type LowValueRule = {
  documentType: DocumentType;
  sourceTier: SourceTier;
  useForScoring: boolean;
  monitorEnabled: boolean;
  baseScore: number;
  hardUrlPatterns?: RegExp[];
  titleUrlPatterns?: RegExp[];
  contentPatterns?: RegExp[];
  reasons: string[];
};

const lowValueRules: LowValueRule[] = [
  {
    documentType: "other",
    sourceTier: "tier_4_ignore",
    useForScoring: false,
    monitorEnabled: false,
    baseScore: 40,
    hardUrlPatterns: [
      /\/swift-codes(?:\/|$)/i,
      /\/bank-codes?(?:\/|$)/i,
      /\/iban(?:\/|$)/i,
      /\/currency-converter(?:\/|$)/i,
    ],
    titleUrlPatterns: [/swift[-\s/]*bic/i, /swift[-\s]?codes?/i, /bank[-\s]?codes?/i, /\biban\b/i],
    contentPatterns: [/swift[-\s]?code/i, /bank[-\s]?code/i, /\biban\b/i, /sort[-\s]?code/i],
    reasons: ["bank, IBAN, or SWIFT directory signals"],
  },
  {
    documentType: "generic_blog_post",
    sourceTier: "tier_4_ignore",
    useForScoring: false,
    monitorEnabled: false,
    baseScore: 24,
    hardUrlPatterns: [/\/blog(?:\/|$)/i, /\/news(?:room)?(?:\/|$)/i],
    titleUrlPatterns: [/\/blog(?:\/|$)/i, /\/news(?:room)?(?:\/|$)/i, /\bblog\b/i, /\bnewsletter\b/i],
    contentPatterns: [/\bread more\b/i, /\bnewsletter\b/i, /\bposted on\b/i],
    reasons: ["blog or newsroom content signals"],
  },
  {
    documentType: "marketing_page",
    sourceTier: "tier_4_ignore",
    useForScoring: false,
    monitorEnabled: false,
    baseScore: 18,
    hardUrlPatterns: [/\/send-money(?:\/|$)/i, /\/compare(?:\/|$)/i, /\/calculator(?:\/|$)/i],
    titleUrlPatterns: [/currency converter/i, /travel money/i, /sign up/i, /get started/i],
    contentPatterns: [/sign up/i, /get started/i, /download the app/i, /open an account/i],
    reasons: ["marketing or product landing copy"],
  },
];

const ruleDefinitions: RuleDefinition[] = [
  {
    documentType: "privacy_policy",
    sourceTier: "tier_1_core",
    useForScoring: true,
    monitorEnabled: true,
    baseScore: 14,
    titleUrlPatterns: [/privacy(?:-policy|-notice|-notices)?/i],
    contentPatterns: [
      "privacy policy",
      "privacy notice",
      "personal data",
      "personal information",
      "data controller",
      "process your data",
      "share your data",
    ],
  },
  {
    documentType: "acceptable_use_policy",
    sourceTier: "tier_1_core",
    useForScoring: true,
    monitorEnabled: true,
    baseScore: 14,
    titleUrlPatterns: [/acceptable[-\s]?use/i, /\/aup\b/i],
    contentPatterns: [
      "acceptable use",
      "prohibited activities",
      "restricted activities",
      "you may not",
      "misuse",
      "sanctions",
      "illegal activity",
    ],
  },
  {
    documentType: "terms_of_service",
    sourceTier: "tier_1_core",
    useForScoring: true,
    monitorEnabled: true,
    baseScore: 13,
    titleUrlPatterns: [/terms(?:-and-conditions|-of-use)?/i, /user-agreement/i, /\bagreement\b/i],
    contentPatterns: [
      "terms and conditions",
      "user agreement",
      "terms of use",
      "by using our services",
      "this agreement",
      "your account",
      "we may suspend",
      "we may terminate",
    ],
  },
  {
    documentType: "fees_page",
    sourceTier: "tier_2_supporting",
    useForScoring: true,
    monitorEnabled: true,
    baseScore: 11,
    titleUrlPatterns: [/\bfees\b/i, /\bpricing\b/i],
    contentPatterns: [
      "fees",
      "pricing",
      "exchange rate",
      "transfer fee",
      "fixed fee",
      "variable fee",
      "pricing page",
    ],
  },
  {
    documentType: "payment_terms",
    sourceTier: "tier_2_supporting",
    useForScoring: true,
    monitorEnabled: true,
    baseScore: 11,
    titleUrlPatterns: [/\bpayout\b/i, /\bwithdrawal\b/i, /\bpayment\b/i, /\bchargeback\b/i],
    contentPatterns: [
      "payout",
      "withdrawal",
      "settlement",
      "payment method",
      "disbursement",
      "hold funds",
      "reserve",
      "chargeback",
    ],
  },
  {
    documentType: "api_terms",
    sourceTier: "tier_2_supporting",
    useForScoring: true,
    monitorEnabled: true,
    baseScore: 10,
    titleUrlPatterns: [/\bdeveloper\b/i, /\bapi\b/i, /integration/i],
    contentPatterns: [
      "developer terms",
      "api terms",
      "api access",
      "rate limits",
      "api key",
      "developer account",
      "integration",
    ],
  },
  {
    documentType: "data_processing_addendum",
    sourceTier: "tier_1_core",
    useForScoring: true,
    monitorEnabled: true,
    baseScore: 12,
    titleUrlPatterns: [/\bdpa\b/i, /data-processing/i, /\bprocessor\b/i, /\bsubprocessor\b/i],
    contentPatterns: [
      "data processing addendum",
      "dpa",
      "processor",
      "controller",
      "subprocessor",
      "gdpr",
    ],
  },
  {
    documentType: "corporate_position",
    sourceTier: "tier_3_context",
    useForScoring: false,
    monitorEnabled: false,
    baseScore: 9,
    titleUrlPatterns: [/policy positions/i, /public policy/i],
    contentPatterns: [
      "policy positions",
      "public policy",
      "we believe",
      "our mission",
      "social responsibility",
      "climate change",
      "diversity and inclusion",
    ],
  },
];

function normalizeText(input: string) {
  return input
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s/-]+/gu, " ")
    .trim();
}

function countMatches(text: string, phrase: string) {
  if (!phrase) {
    return 0;
  }

  let count = 0;
  let index = text.indexOf(phrase);
  while (index !== -1) {
    count += 1;
    index = text.indexOf(phrase, index + phrase.length);
  }
  return count;
}

function buildDefaultResult(reasons: string[]): ContentClassification {
  return {
    documentType: "other",
    sourceTier: "tier_3_context",
    useForScoring: false,
    monitorEnabled: false,
    confidence: 0.42,
    classificationReasons: reasons.length ? reasons : ["no strong content signals matched"],
  };
}

function clipForClassification(input: string) {
  return input.slice(0, 12000);
}

export function classifyDocumentFromContent(input: {
  url: string;
  title?: string | null;
  markdownText?: string | null;
  plainText?: string | null;
}) {
  const title = input.title ?? "";
  const titleUrlText = normalizeText([input.url, title].join(" "));
  const contentSource = input.plainText?.trim() || input.markdownText?.trim() || "";
  const contentText = normalizeText(clipForClassification(contentSource));
  const reasons: string[] = [];

  for (const rule of lowValueRules) {
    if (rule.hardUrlPatterns?.some((pattern) => pattern.test(input.url))) {
      return {
        documentType: rule.documentType,
        sourceTier: rule.sourceTier,
        useForScoring: rule.useForScoring,
        monitorEnabled: rule.monitorEnabled,
        confidence: 0.99,
        classificationReasons: [...rule.reasons, "hard URL filter matched"],
      };
    }
  }

  let bestLowValue:
    | (ContentClassification & {
        score: number;
      })
    | null = null;

  for (const rule of lowValueRules) {
    const titleUrlMatches = (rule.titleUrlPatterns ?? []).filter((pattern) =>
      pattern.test(titleUrlText),
    );
    const contentMatches = (rule.contentPatterns ?? []).filter((pattern) =>
      pattern.test(contentText),
    );

    if (!titleUrlMatches.length && !contentMatches.length) {
      continue;
    }

    const score =
      rule.baseScore + titleUrlMatches.length * 7 + contentMatches.length * 3;
    const result = {
      documentType: rule.documentType,
      sourceTier: rule.sourceTier,
      useForScoring: rule.useForScoring,
      monitorEnabled: rule.monitorEnabled,
      confidence: Math.min(0.98, 0.52 + score / 50),
      classificationReasons: [
        ...rule.reasons,
        ...titleUrlMatches.map((pattern) => `matched title/url pattern ${pattern}`),
        ...contentMatches.map((pattern) => `matched content pattern ${pattern}`),
      ],
      score,
    };

    if (!bestLowValue || result.score > bestLowValue.score) {
      bestLowValue = result;
    }
  }

  let bestRule:
    | (ContentClassification & {
        score: number;
      })
    | null = null;

  for (const rule of ruleDefinitions) {
    const titleUrlMatches = rule.titleUrlPatterns.filter((pattern) =>
      typeof pattern === "string"
        ? titleUrlText.includes(normalizeText(pattern))
        : pattern.test(titleUrlText),
    );
    const contentMatches = rule.contentPatterns.filter((pattern) =>
      contentText.includes(normalizeText(pattern)),
    );

    if (!titleUrlMatches.length && !contentMatches.length) {
      continue;
    }

    const contentDensity = contentMatches.reduce(
      (total, pattern) => total + countMatches(contentText, normalizeText(pattern)),
      0,
    );
    const score =
      rule.baseScore +
      titleUrlMatches.length * 8 +
      contentMatches.length * 3 +
      contentDensity;

    const result = {
      documentType: rule.documentType,
      sourceTier: rule.sourceTier,
      useForScoring: rule.useForScoring,
      monitorEnabled: rule.monitorEnabled,
      confidence: Math.min(0.99, 0.5 + score / 42),
      classificationReasons: [
        ...titleUrlMatches.map((pattern) =>
          `matched title/url signal ${typeof pattern === "string" ? pattern : pattern}`,
        ),
        ...contentMatches.map((pattern) => `matched content phrase "${pattern}"`),
      ],
      score,
    };

    if (!bestRule || result.score > bestRule.score) {
      bestRule = result;
    }
  }

  if (bestLowValue && (!bestRule || bestLowValue.score >= bestRule.score + 8)) {
    return bestLowValue;
  }

  if (bestRule) {
    return bestRule;
  }

  if (bestLowValue) {
    return bestLowValue;
  }

  if (contentText.length < 500) {
    reasons.push("extracted text is short");
  }

  return buildDefaultResult(reasons);
}
