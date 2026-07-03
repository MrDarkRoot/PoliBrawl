import type { UrlClassification } from "@/server/services/discovery/classifier";

type CandidateFilterDecision = "keep" | "maybe" | "drop";

export type FilteredCandidate = {
  url: string;
  canonicalUrl: string;
  title: string | null;
  suggestedDocumentType: string;
  suggestedTier: string;
  confidence: number;
  detectionReason: string;
  filterScore: number;
  filterDecision: CandidateFilterDecision;
  filterReasons: string[];
};

type CandidateInput = {
  url: string;
  title: string | null;
  detectionReason: string;
  urlClassification: UrlClassification;
};

const positiveSignals: Array<{ pattern: RegExp; score: number; reason: string }> = [
  { pattern: /\blegal\b/i, score: 8, reason: "legal signal" },
  { pattern: /\bterms\b|\bagreement\b|terms-and-conditions|user-agreement/i, score: 10, reason: "terms signal" },
  { pattern: /privacy(?:-notice|-policy|-notices)?/i, score: 11, reason: "privacy signal" },
  { pattern: /acceptable[-\s]?use|\/aup\b/i, score: 10, reason: "acceptable use signal" },
  { pattern: /\bfees\b|\bpricing\b/i, score: 7, reason: "fees or pricing signal" },
  { pattern: /\bpayment\b|\bpayout\b|\brefund\b|\bdispute\b|\bcomplaint\b/i, score: 7, reason: "payments policy signal" },
  { pattern: /\bverification\b|\bidentity\b|\bkyc\b/i, score: 6, reason: "identity verification signal" },
  { pattern: /\bdeveloper\b|\bapi\b/i, score: 5, reason: "developer signal" },
  { pattern: /\bdpa\b|data-processing/i, score: 10, reason: "data processing signal" },
  { pattern: /\bsecurity\b|\btrust\b/i, score: 6, reason: "security or trust signal" },
  { pattern: /policy-updates|legalhub/i, score: 6, reason: "policy index signal" },
];

const negativeSignals: Array<{ pattern: RegExp; score: number; reason: string }> = [
  { pattern: /\/blog\//i, score: -18, reason: "blog path" },
  { pattern: /\/news(?:room)?\//i, score: -16, reason: "news or newsroom path" },
  { pattern: /\/careers?\//i, score: -18, reason: "careers path" },
  { pattern: /\/jobs?\//i, score: -18, reason: "jobs path" },
  { pattern: /\/swift-codes(?:\/countries)?\//i, score: -28, reason: "swift code directory path" },
  { pattern: /\/currency-converter\//i, score: -24, reason: "currency converter path" },
  { pattern: /\/send-money\//i, score: -18, reason: "send money marketing path" },
  { pattern: /\/bank-codes?\//i, score: -24, reason: "bank code directory path" },
  { pattern: /\/iban\//i, score: -24, reason: "IBAN directory path" },
  { pattern: /\/route\//i, score: -12, reason: "route path" },
  { pattern: /\/compare\//i, score: -16, reason: "comparison marketing path" },
  { pattern: /\/reviews?\//i, score: -14, reason: "reviews path" },
  { pattern: /\/help\//i, score: -12, reason: "help center path" },
  { pattern: /\/articles?\//i, score: -12, reason: "articles path" },
  { pattern: /\/calculator\//i, score: -18, reason: "calculator path" },
  { pattern: /\/campaign\//i, score: -18, reason: "campaign path" },
  { pattern: /\/press\//i, score: -16, reason: "press path" },
  { pattern: /\/investor\//i, score: -16, reason: "investor path" },
  { pattern: /\/about\//i, score: -12, reason: "about page path" },
  { pattern: /\/team\//i, score: -12, reason: "team page path" },
  { pattern: /\/partners?\//i, score: -12, reason: "partners path" },
];

const localeSegmentPattern = /^[a-z]{2}(?:-[a-z]{2})?$/i;

function isStrongLegalPath(value: string) {
  return (
    /(^|\/)legal(?:\/|$)/i.test(value) ||
    /terms(?:-and-conditions|-of-use)?/i.test(value) ||
    /privacy(?:-policy|-notice|-notices)?/i.test(value) ||
    /acceptable[-\s]?use|\/aup\b/i.test(value) ||
    /policy-updates/i.test(value) ||
    /complaint|dispute|refund|security|trust|dpa|data-processing/i.test(value)
  );
}

function isHardDropDirectoryPath(value: string) {
  return (
    /\/swift-codes(?:\/|$)/i.test(value) ||
    /\/bank-codes?(?:\/|$)/i.test(value) ||
    /\/iban(?:\/|$)/i.test(value) ||
    /\/currency-converter(?:\/|$)/i.test(value)
  );
}

function normalizeUrl(rawUrl: string) {
  const parsed = new URL(rawUrl);
  parsed.hash = "";

  const trackingParams = [
    "fbclid",
    "gclid",
    "mc_cid",
    "mc_eid",
    "ref",
    "source",
    "utm_campaign",
    "utm_content",
    "utm_medium",
    "utm_source",
    "utm_term",
  ];

  for (const key of [...parsed.searchParams.keys()]) {
    if (trackingParams.includes(key) || key.startsWith("utm_")) {
      parsed.searchParams.delete(key);
    }
  }

  if (!parsed.searchParams.toString()) {
    parsed.search = "";
  }

  parsed.pathname = parsed.pathname !== "/" ? parsed.pathname.replace(/\/+$/, "") || "/" : "/";

  return parsed.toString();
}

function stripLocalePrefix(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  if (!segments.length) {
    return pathname;
  }

  if (localeSegmentPattern.test(segments[0] ?? "")) {
    return `/${segments.slice(1).join("/")}`;
  }

  return pathname;
}

function buildDedupeKey(url: string) {
  const parsed = new URL(url);
  const legalish = isStrongLegalPath(parsed.pathname);
  const normalizedPath = legalish ? parsed.pathname : stripLocalePrefix(parsed.pathname);

  return `${parsed.origin}${normalizedPath}`;
}

function classifyDecision(score: number) {
  if (score >= 10) {
    return "keep" as const;
  }

  if (score >= 3) {
    return "maybe" as const;
  }

  return "drop" as const;
}

export function filterDiscoveryCandidates(input: { candidates: CandidateInput[] }) {
  const prepared = input.candidates.map((candidate) => {
    const canonicalUrl = normalizeUrl(candidate.url);
    const haystack = [canonicalUrl, candidate.title, candidate.urlClassification.documentType]
      .filter(Boolean)
      .join(" ");
    const reasons = [...candidate.urlClassification.reasons];
    let score = 0;
    const hardDropDirectory = isHardDropDirectoryPath(canonicalUrl);

    for (const signal of positiveSignals) {
      if (signal.pattern.test(haystack)) {
        score += signal.score;
        reasons.push(signal.reason);
      }
    }

    for (const signal of negativeSignals) {
      if (signal.pattern.test(haystack)) {
        score += signal.score;
        reasons.push(signal.reason);
      }
    }

    if (/\/swift-codes\/countries\//i.test(canonicalUrl)) {
      score -= 15;
      reasons.push("country directory path");
    }

    if (/\/swift-codes\/[a-z0-9-]+$/i.test(canonicalUrl)) {
      score -= 12;
      reasons.push("bank directory path");
    }

    const segments = new URL(canonicalUrl).pathname.split("/").filter(Boolean);
    if (segments.length >= 5 && !isStrongLegalPath(canonicalUrl)) {
      score -= 6;
      reasons.push("deep non-legal path");
    }

    if (candidate.urlClassification.sourceTier === "tier_4_ignore") {
      score -= 8;
      reasons.push("url classifier marked low-value");
    }

    if (candidate.urlClassification.sourceTier === "tier_1_core") {
      score += 4;
      reasons.push("url classifier marked core legal");
    }

    if (candidate.detectionReason === "generated_path") {
      score += 1;
      reasons.push("generated legal path candidate");
    }

    if (hardDropDirectory) {
      score -= 30;
      reasons.push("hard drop directory path");
    }

    return {
      ...candidate,
      canonicalUrl,
      dedupeKey: buildDedupeKey(canonicalUrl),
      hardDropDirectory,
      filterScore: score,
      filterReasons: Array.from(new Set(reasons)),
    };
  });

  const bestByKey = new Map<string, number>();
  prepared.forEach((candidate, index) => {
    const current = bestByKey.get(candidate.dedupeKey);
    if (current === undefined || prepared[current].filterScore < candidate.filterScore) {
      bestByKey.set(candidate.dedupeKey, index);
    }
  });

  const filteredCandidates = prepared.map((candidate, index) => {
    const duplicateIndex = bestByKey.get(candidate.dedupeKey);
    let filterScore = candidate.filterScore;
    const filterReasons = [...candidate.filterReasons];
    let filterDecision = classifyDecision(filterScore);

    if (duplicateIndex !== undefined && duplicateIndex !== index) {
      filterScore -= 12;
      filterDecision = "drop";
      filterReasons.push(`duplicate of ${prepared[duplicateIndex].canonicalUrl}`);
    }

    if (
      !candidate.hardDropDirectory &&
      filterDecision !== "keep" &&
      isStrongLegalPath(candidate.canonicalUrl) &&
      candidate.urlClassification.sourceTier === "tier_1_core"
    ) {
      filterDecision = "maybe";
      filterScore = Math.max(filterScore, 4);
      filterReasons.push("preserved because URL looks legally relevant");
    }

    if (candidate.hardDropDirectory) {
      filterDecision = "drop";
      filterScore = Math.min(filterScore, -20);
    }

    return {
      url: candidate.url,
      canonicalUrl: candidate.canonicalUrl,
      title: candidate.title,
      suggestedDocumentType: candidate.urlClassification.documentType,
      suggestedTier: candidate.urlClassification.sourceTier,
      confidence: candidate.urlClassification.confidence,
      detectionReason: candidate.detectionReason,
      filterScore,
      filterDecision,
      filterReasons: Array.from(new Set(filterReasons)),
    } satisfies FilteredCandidate;
  });

  const counts = filteredCandidates.reduce(
    (acc, candidate) => {
      acc[candidate.filterDecision] += 1;
      return acc;
    },
    { keep: 0, maybe: 0, drop: 0 },
  );

  return {
    candidates: filteredCandidates,
    counts,
  };
}
