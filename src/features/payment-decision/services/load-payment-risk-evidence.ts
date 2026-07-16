import "server-only";

import { isSafeHttpUrl } from "@/features/shared/schemas/http-url";
import {
  evaluatePlatformReadiness,
} from "@/features/payment-decision/services/evaluate-platform-readiness";
import {
  paymentDecisionPlatformSlugs,
  type EvidenceClarity,
  type InternalDecisionEvidence,
  type InternalMatchedDecisionRisk,
  type PaymentDecisionCountry,
  type PaymentDecisionPlatformSlug,
  type PaymentDecisionProfile,
  type PaymentRiskCategory,
  type PlatformReadinessState,
} from "@/features/payment-decision/types/payment-decision.types";
import { queryMany, queryOne } from "@/server/polibrawl/db";

type PlatformRow = {
  id: string;
  slug: PaymentDecisionPlatformSlug;
  name: string;
  category: string;
  website_url: string | null;
  summary: string | null;
  main_level: string | null;
  last_reviewed_at: string | null;
  published_at: string | null;
};

type SourceRow = {
  id: string;
  source_type: string;
  priority: string;
  title: string;
  url: string | null;
  last_reviewed_at: string | null;
  reviewed_at: string | null;
};

type EvidenceRow = {
  risk_id: string;
  risk_slug: string;
  risk_title: string;
  risk_category: string;
  risk_level: "low" | "medium" | "high" | "critical" | "unknown";
  risk_summary: string;
  why_it_matters: string;
  risk_reviewed_at: string | null;
  risk_published_at: string | null;
  risk_excerpt: string | null;
  primary_evidence_reference: string | null;
  evidence_id: string;
  evidence_title: string | null;
  evidence_excerpt: string;
  evidence_source_title: string;
  evidence_source_url: string | null;
  evidence_reviewed_at: string | null;
  evidence_published_at: string | null;
  evidence_confidence: string | null;
  source_id: string;
  source_type: string;
  source_priority: string;
  registry_source_title: string;
  registry_source_url: string | null;
  source_last_reviewed_at: string | null;
  source_reviewed_at: string | null;
};

type ResolutionRouteCount = {
  count: string;
};

type DatabaseDate = string | Date | null;

const platformDisplayNames: Record<PaymentDecisionPlatformSlug, string> = {
  paypal: "PayPal",
  wise: "Wise",
  payoneer: "Payoneer",
  stripe: "Stripe",
  deel: "Deel",
};

const riskCopy: Record<
  PaymentRiskCategory,
  { title: string; relevance: string; possibleImpact: string }
> = {
  fund_hold: {
    title: "Fund hold risk",
    relevance:
      "The evidence describes conditions where received funds may not be immediately available.",
    possibleImpact:
      "A payout can become operationally unavailable while you still owe work, taxes, bills, or contractor costs.",
  },
  reserve: {
    title: "Reserve risk",
    relevance:
      "The evidence describes platform authority to hold a reserve or retain part of the balance.",
    possibleImpact:
      "A portion of the payment may remain unavailable even after the payer has sent funds.",
  },
  withdrawal_restriction: {
    title: "Withdrawal restriction risk",
    relevance:
      "The evidence describes limits, prerequisites, or interruptions around moving funds off the platform.",
    possibleImpact:
      "Money may be visible in the platform account but unavailable in your bank or preferred payout route.",
  },
  account_limitation: {
    title: "Account limitation risk",
    relevance:
      "The evidence describes account restriction, limitation, suspension, closure, or review authority.",
    possibleImpact:
      "You may lose normal account access or payout capability while a review is pending.",
  },
  kyc_verification: {
    title: "Verification request risk",
    relevance:
      "The evidence describes identity, business, tax, or source-of-funds verification requirements.",
    possibleImpact:
      "Funds can be delayed while documents are collected, reviewed, or corrected.",
  },
  chargeback: {
    title: "Chargeback and dispute risk",
    relevance:
      "The evidence describes chargeback, dispute, reversal, refund, or buyer-protection processes.",
    possibleImpact:
      "A completed service or payout can still create negative balance, evidence burden, or repayment pressure.",
  },
  appeal_support: {
    title: "Appeal and support path risk",
    relevance:
      "The evidence describes support, appeal, review, or resolution routes for platform decisions.",
    possibleImpact:
      "If the process is unclear, you may spend critical time reconstructing evidence after access is already interrupted.",
  },
  country_eligibility: {
    title: "Country eligibility risk",
    relevance:
      "The evidence describes country availability, jurisdiction, or location-specific payout support.",
    possibleImpact:
      "A route may be usable for some users but not reliable for Vietnam or another specific country.",
  },
  payer_compatibility: {
    title: "Payer compatibility risk",
    relevance:
      "The evidence describes whether the payer can send this payout type through the platform.",
    possibleImpact:
      "The route may be theoretically available but unusable for a specific payer, program, marketplace, or currency.",
  },
};

function includesAny(value: string, keywords: string[]) {
  const normalized = value.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

function safeSourceUrl(row: EvidenceRow) {
  const candidates = [row.evidence_source_url, row.registry_source_url].filter(
    Boolean,
  ) as string[];

  return candidates.find(isSafeHttpUrl) ?? null;
}

function normalizeConfidence(value: string | null) {
  if (value === "low" || value === "moderate" || value === "high") {
    return value;
  }

  return "unknown";
}

function classifyRiskCategories(row: EvidenceRow): PaymentRiskCategory[] {
  const text = [
    row.risk_slug,
    row.risk_title,
    row.risk_category,
    row.risk_summary,
    row.why_it_matters,
    row.risk_excerpt,
    row.evidence_title,
    row.evidence_excerpt,
    row.evidence_source_title,
    row.registry_source_title,
    row.source_type,
  ]
    .filter(Boolean)
    .join(" ");
  const categories = new Set<PaymentRiskCategory>();

  if (includesAny(text, ["hold", "freeze", "frozen", "delayed availability"])) {
    categories.add("fund_hold");
  }

  if (includesAny(text, ["reserve", "rolling reserve", "retain funds"])) {
    categories.add("reserve");
  }

  if (
    row.risk_category === "payout" ||
    ["payout_terms", "payment_terms"].includes(row.source_type) ||
    includesAny(text, ["withdraw", "withdrawal", "payout", "bank transfer"])
  ) {
    categories.add("withdrawal_restriction");
  }

  if (
    row.risk_category === "account" ||
    row.source_type === "account_limits" ||
    includesAny(text, ["limitation", "restricted", "suspend", "terminate", "close account"])
  ) {
    categories.add("account_limitation");
  }

  if (
    row.risk_category === "kyc" ||
    row.source_type === "kyc_verification" ||
    includesAny(text, ["kyc", "identity", "verify", "verification", "document"])
  ) {
    categories.add("kyc_verification");
  }

  if (
    row.source_type === "refund_chargeback" ||
    includesAny(text, ["chargeback", "dispute", "reversal", "refund"])
  ) {
    categories.add("chargeback");
  }

  if (
    row.risk_category === "appeal" ||
    row.source_type === "appeals" ||
    includesAny(text, ["appeal", "support", "resolution", "complaint"])
  ) {
    categories.add("appeal_support");
  }

  if (
    includesAny(text, ["country", "eligible", "eligibility", "available in", "vietnam", "jurisdiction"])
  ) {
    categories.add("country_eligibility");
  }

  if (
    includesAny(text, ["payer", "sender", "merchant", "client", "marketplace", "receive payments", "recipient"])
  ) {
    categories.add("payer_compatibility");
  }

  return Array.from(categories);
}

function buildEmptyProfile(
  slug: PaymentDecisionPlatformSlug,
  readinessState: PlatformReadinessState,
  readinessReasons: string[],
): PaymentDecisionProfile {
  return {
    platform: {
      id: null,
      slug,
      name: platformDisplayNames[slug],
      websiteUrl: null,
      category: null,
      lastReviewedAt: null,
      publishedAt: null,
    },
    readinessState,
    readinessReasons,
    risks: [],
    evidence: [],
    coverage: {
      countryEligibility: "missing",
      payerCompatibility: "missing",
      withdrawalPath: "missing",
      appealClarity: "missing",
      officialSourceCount: 0,
      approvedEvidenceCount: 0,
      latestReviewedAt: null,
      oldEvidence: false,
      discretionaryLanguage: false,
    },
  };
}

function normalizeDate(value: DatabaseDate | undefined) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function latestDate(values: Array<DatabaseDate | undefined>) {
  return values
    .map(normalizeDate)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => right.localeCompare(left))[0] ?? null;
}

function isOldDate(value: string | null) {
  if (!value) {
    return true;
  }

  const parsed = new Date(value).getTime();
  if (Number.isNaN(parsed)) {
    return true;
  }

  const eighteenMonths = 1000 * 60 * 60 * 24 * 548;
  return Date.now() - parsed > eighteenMonths;
}

function hasDiscretionaryLanguage(evidence: InternalDecisionEvidence[]) {
  return evidence.some((item) =>
    includesAny(item.excerpt, [
      "sole discretion",
      "reserve the right",
      "may hold",
      "may limit",
      "may suspend",
      "at any time",
    ]),
  );
}

function countryCoverage(
  risks: InternalMatchedDecisionRisk[],
  country: PaymentDecisionCountry | undefined,
): EvidenceClarity {
  const countryEvidence = risks
    .filter((risk) => risk.category === "country_eligibility")
    .flatMap((risk) => risk.evidence);

  if (countryEvidence.length === 0) {
    return "missing";
  }

  if (!country || country === "country_verification_required") {
    return "limited";
  }

  const countryName = country === "vietnam" ? "vietnam" : country;
  return countryEvidence.some((item) =>
    `${item.excerpt} ${item.title} ${item.sourceTitle}`.toLowerCase().includes(countryName),
  )
    ? "documented"
    : "limited";
}

function coverageFromRisk(
  risks: InternalMatchedDecisionRisk[],
  category: PaymentRiskCategory,
): EvidenceClarity {
  return risks.some((risk) => risk.category === category) ? "documented" : "unknown";
}

function appealCoverage(
  risks: InternalMatchedDecisionRisk[],
  resolutionRouteCount: number,
): EvidenceClarity {
  if (resolutionRouteCount > 0 || risks.some((risk) => risk.category === "appeal_support")) {
    return "documented";
  }

  if (risks.some((risk) => risk.category === "account_limitation")) {
    return "low";
  }

  return "unknown";
}

function buildRisks(rows: EvidenceRow[]) {
  const riskMap = new Map<string, InternalMatchedDecisionRisk>();
  const evidence: InternalDecisionEvidence[] = [];

  for (const row of rows) {
    const sourceUrl = safeSourceUrl(row);
    if (!sourceUrl) {
      continue;
    }

    const categories = classifyRiskCategories(row);
    for (const category of categories) {
      const publicEvidence: InternalDecisionEvidence = {
        internalEvidenceId: row.evidence_id,
        internalRiskId: row.risk_id,
        internalSourceId: row.source_id,
        title: row.evidence_title ?? row.risk_title,
        excerpt: row.evidence_excerpt,
        sourceTitle: row.evidence_source_title || row.registry_source_title,
        sourceUrl,
        reviewedAt: normalizeDate(
          row.evidence_reviewed_at ??
          row.source_reviewed_at ??
          row.source_last_reviewed_at ??
          row.risk_reviewed_at,
        ),
        publishedAt: normalizeDate(row.evidence_published_at ?? row.risk_published_at),
        riskCategory: category,
        confidence: normalizeConfidence(row.evidence_confidence),
      };
      const riskKey = `${row.risk_id}:${category}`;
      const copy = riskCopy[category];
      const existing = riskMap.get(riskKey);

      if (existing) {
        existing.evidence.push(publicEvidence);
      } else {
        riskMap.set(riskKey, {
          internalRiskId: row.risk_id,
          category,
          title: row.risk_title || copy.title,
          relevance: copy.relevance,
          possibleImpact: copy.possibleImpact,
          level: row.risk_level,
          evidence: [publicEvidence],
        });
      }

      evidence.push(publicEvidence);
    }
  }

  return {
    risks: Array.from(riskMap.values()),
    evidence,
  };
}

async function loadPlatform(slug: PaymentDecisionPlatformSlug) {
  return queryOne<PlatformRow>(
    `select
       id,
       slug,
       name,
       category,
       website_url,
       summary,
       main_level,
       last_reviewed_at,
       published_at
     from platforms
     where slug = $1
       and status = 'published'
       and archived_at is null
     limit 1`,
    [slug],
  );
}

async function loadSources(platformId: string) {
  return queryMany<SourceRow>(
    `select
       id,
       source_type,
       priority,
       title,
       url,
       last_reviewed_at,
       reviewed_at
     from sources
     where platform_id = $1
       and status = 'active'
       and archived_at is null
       and priority <> 'ignore'
     order by priority asc, updated_at desc`,
    [platformId],
  );
}

async function loadEvidenceRows(platformId: string) {
  return queryMany<EvidenceRow>(
    `select
       rf.id as risk_id,
       rf.slug as risk_slug,
       rf.title as risk_title,
       rf.category as risk_category,
       rf.level as risk_level,
       rf.summary as risk_summary,
       rf.why_it_matters,
       rf.reviewed_at as risk_reviewed_at,
       rf.published_at as risk_published_at,
       rf.excerpt as risk_excerpt,
       rf.primary_evidence_reference,
       e.id as evidence_id,
       e.title as evidence_title,
       e.excerpt as evidence_excerpt,
       e.source_title as evidence_source_title,
       e.source_url as evidence_source_url,
       e.reviewed_at as evidence_reviewed_at,
       e.published_at as evidence_published_at,
       e.confidence as evidence_confidence,
       s.id as source_id,
       s.source_type,
       s.priority as source_priority,
       s.title as registry_source_title,
       s.url as registry_source_url,
       s.last_reviewed_at as source_last_reviewed_at,
       s.reviewed_at as source_reviewed_at
     from red_flags rf
     join evidence e
       on e.red_flag_id = rf.id
      and e.status = 'approved'
      and e.archived_at is null
     join sources s
       on s.id = e.source_id
      and s.status = 'active'
      and s.archived_at is null
      and s.priority <> 'ignore'
     where rf.platform_id = $1
       and rf.status = 'published'
       and rf.archived_at is null
     order by rf.reviewed_at desc nulls last, e.display_order asc nulls last, e.sort_order asc`,
    [platformId],
  );
}

async function loadResolutionRouteCount(platformId: string) {
  const result = await queryOne<ResolutionRouteCount>(
    `select count(*)::text as count
     from resolution_routes
     where platform_id = $1
       and status = 'published'
       and archived_at is null`,
    [platformId],
  );

  return Number(result?.count ?? 0);
}

export function isPaymentDecisionPlatformSlug(
  value: string,
): value is PaymentDecisionPlatformSlug {
  return paymentDecisionPlatformSlugs.includes(value as PaymentDecisionPlatformSlug);
}

export async function loadPaymentRiskEvidence(
  platformSlug: PaymentDecisionPlatformSlug,
  country?: PaymentDecisionCountry,
): Promise<PaymentDecisionProfile> {
  const platform = await loadPlatform(platformSlug);

  if (!platform) {
    return buildEmptyProfile(platformSlug, "not_reviewed", [
      "Platform is in the Sprint 11 allowlist but has no published profile.",
    ]);
  }

  const [sources, evidenceRows, resolutionRouteCount] = await Promise.all([
    loadSources(platform.id),
    loadEvidenceRows(platform.id),
    loadResolutionRouteCount(platform.id),
  ]);
  const safeOfficialSources = sources.filter((source) => {
    if (!source.url || !isSafeHttpUrl(source.url)) {
      return false;
    }

    return [
      "terms",
      "user_agreement",
      "payment_terms",
      "payout_terms",
      "account_limits",
      "kyc_verification",
      "refund_chargeback",
      "appeals",
    ].includes(source.source_type);
  });
  const { risks, evidence } = buildRisks(evidenceRows);
  const latestReviewedAt = latestDate([
    platform.last_reviewed_at,
    ...safeOfficialSources.map((source) => source.last_reviewed_at ?? source.reviewed_at),
    ...evidence.map((item) => item.reviewedAt),
  ]);
  const coverage = {
    countryEligibility: countryCoverage(risks, country),
    payerCompatibility: coverageFromRisk(risks, "payer_compatibility"),
    withdrawalPath: coverageFromRisk(risks, "withdrawal_restriction"),
    appealClarity: appealCoverage(risks, resolutionRouteCount),
    officialSourceCount: safeOfficialSources.length,
    approvedEvidenceCount: evidence.length,
    latestReviewedAt,
    oldEvidence: isOldDate(latestReviewedAt),
    discretionaryLanguage: hasDiscretionaryLanguage(evidence),
  };
  const readiness = evaluatePlatformReadiness({
    hasPlatformProfile: true,
    isPaymentPlatform: platform.category === "payment",
    officialSourceCount: coverage.officialSourceCount,
    relevantRiskCount: risks.length,
    approvedEvidenceCount: coverage.approvedEvidenceCount,
    hasReviewedDate: Boolean(latestReviewedAt),
    countryEligibility: coverage.countryEligibility,
    applicableActionCount: risks.length > 0 ? 1 : 0,
  });

  return {
    platform: {
      id: platform.id,
      slug: platform.slug,
      name: platform.name,
      websiteUrl: platform.website_url && isSafeHttpUrl(platform.website_url)
        ? platform.website_url
        : null,
      category: platform.category,
      lastReviewedAt: normalizeDate(platform.last_reviewed_at),
      publishedAt: normalizeDate(platform.published_at),
    },
    readinessState: readiness.state,
    readinessReasons: readiness.reasons,
    risks,
    evidence,
    coverage,
  };
}

export async function listPaymentDecisionPlatformOptions(country?: PaymentDecisionCountry) {
  const profiles = await Promise.all(
    paymentDecisionPlatformSlugs.map((slug) => loadPaymentRiskEvidence(slug, country)),
  );

  return profiles.map((profile) => ({
    slug: profile.platform.slug,
    name: profile.platform.name,
    readinessState: profile.readinessState,
    readinessReasons: profile.readinessReasons,
  }));
}
