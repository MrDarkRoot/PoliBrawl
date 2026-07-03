// Research Packet Builder Service
// Deterministic — no AI, no external calls, no hallucinations.
// Runs after candidate creation to produce a structured evidence bundle.
import "server-only";

import {
  createResearchPacket,
  insertResearchPacketEvidence,
  findResearchPacket,
} from "@/server/polibrawl/repositories/research-packet.repository";
import { listKeywordMatches } from "@/server/polibrawl/repositories/keyword-match.repository";
import { findSourceById } from "@/server/polibrawl/repositories/source.repository";
import {
  RED_FLAG_SUGGESTED_TITLES,
  RED_FLAG_SUGGESTED_LEVELS,
} from "@/lib/polibrawl/red-flag-taxonomy";
import type {
  ResearchPacket,
  ResearchPacketWithEvidence,
  KeywordMatch,
  Uuid,
} from "@/types/polibrawl";

// ---------------------------------------------------------------------------
// Confidence scoring — deterministic heuristics only
// ---------------------------------------------------------------------------

// High-value terms that directly signal financial/account risk
const HIGH_VALUE_TERMS = [
  "hold funds",
  "reserve",
  "180 days",
  "terminate account",
  "close account",
  "suspend",
  "verify identity",
  "withhold",
  "negative balance",
  "chargeback",
  "freeze",
];

// Context signals for positive confidence
const POSITIVE_CONTEXT_SIGNALS = [
  /\b(shall|may|will|can|reserve the right)\b/i,
  /\b(policy|agreement|terms|clause|section)\b/i,
  /\b(days|weeks|business days)\b/i,
];

// Noise patterns that reduce confidence
const NOISE_CONTEXT_SIGNALS = [
  /\bfooter\b/i,
  /\bnavigation\b/i,
  /\bcookie\b/i,
  /\bcopyright\b/i,
  /all rights reserved/i,
  /\bsitemap\b/i,
  /contact us|help center|learn more/i,
];

function scoreEvidence(
  excerpt: string,
  contextBefore: string,
  contextAfter: string,
  keywords: string[],
): { confidence: number; noise: number } {
  let confidence = 0;
  let noise = 0;

  const fullText = `${contextBefore} ${excerpt} ${contextAfter}`.toLowerCase();

  // +30 if multiple keywords nearby (2+)
  if (keywords.length >= 2) confidence += 30;

  // +20 if long paragraph (suggests substantive policy section)
  if (excerpt.length > 400) confidence += 20;

  // +20 if contains any high-value risk terms
  for (const term of HIGH_VALUE_TERMS) {
    if (fullText.includes(term.toLowerCase())) {
      confidence += 20;
      break; // cap at one bonus
    }
  }

  // +10 if contains a legal heading signal
  if (POSITIVE_CONTEXT_SIGNALS.some((re) => re.test(fullText))) {
    confidence += 10;
  }

  // Noise deductions
  // -40 if footer
  if (/footer|all rights reserved/i.test(fullText)) noise += 40;

  // -30 if navigation / sitemap
  if (/navigation|sitemap|breadcrumb/i.test(fullText)) noise += 30;

  // -30 if cookie banner
  if (/cookie consent|accept cookies|cookie banner/i.test(fullText)) noise += 30;

  // -20 if header / hero
  if (/hero section|page header|site header/i.test(fullText)) noise += 20;

  // -5 per extra noise signal
  for (const re of NOISE_CONTEXT_SIGNALS) {
    if (re.test(fullText)) noise += 5;
  }

  // Very short excerpt — low information value
  if (excerpt.length < 80) {
    confidence -= 10;
    noise += 5;
  }

  // Clamp to [0, 100]
  confidence = Math.max(0, Math.min(100, confidence));
  noise = Math.max(0, Math.min(100, noise));

  return { confidence, noise };
}

// ---------------------------------------------------------------------------
// Aggregate confidence score for the entire packet
// ---------------------------------------------------------------------------

function aggregatePacketScores(
  evidenceItems: Array<{ confidence: number; noise: number }>,
): { confidence: number; noise: number } {
  if (evidenceItems.length === 0) return { confidence: 0, noise: 0 };

  // Top-3 best evidence items weighted more heavily
  const sorted = [...evidenceItems].sort((a, b) => b.confidence - a.confidence);
  const top = sorted.slice(0, 3);

  const avgConf = top.reduce((s, e) => s + e.confidence, 0) / top.length;
  const avgNoise = sorted.reduce((s, e) => s + e.noise, 0) / sorted.length;

  return {
    confidence: Math.round(avgConf),
    noise: Math.round(avgNoise),
  };
}

// ---------------------------------------------------------------------------
// Section hint extraction — deterministic
// ---------------------------------------------------------------------------

const SECTION_HEADINGS: RegExp[] = [
  /section\s+\d+[\.\:]/i,
  /article\s+\d+[\.\:]/i,
  /\d+\.\s+[A-Z][a-z]+/,
  /^[A-Z][A-Z\s]{4,}$/m, // ALL CAPS heading
];

function detectSectionHint(contextBefore: string): string | null {
  for (const re of SECTION_HEADINGS) {
    const m = contextBefore.match(re);
    if (m) return m[0].trim().slice(0, 80);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Deterministic summary template
// ---------------------------------------------------------------------------

const CATEGORY_SUMMARY_TEMPLATES: Record<string, (platform: string, count: number) => string> = {
  money: (p, c) =>
    `The scanner detected ${c} policy statement${c > 1 ? "s" : ""} related to funds holds, reserves, and payout delays in ${p}'s agreement. Evidence references official policy sections discussing balance availability and reserve conditions.`,
  account: (p, c) =>
    `The scanner found ${c} policy clause${c > 1 ? "s" : ""} concerning account restrictions, suspensions, and terminations in ${p}'s terms. Evidence references official sections governing access control and limitation authority.`,
  kyc: (p, c) =>
    `The scanner identified ${c} verification-related clause${c > 1 ? "s" : ""} in ${p}'s agreement. Evidence references identity verification requirements, document submission rules, and compliance review triggers.`,
  payout: (p, c) =>
    `The scanner found ${c} payout-related clause${c > 1 ? "s" : ""} in ${p}'s terms. Evidence references settlement timelines, withdrawal conditions, and payment method restrictions.`,
  appeal: (p, c) =>
    `The scanner found ${c} clause${c > 1 ? "s" : ""} related to appeals and dispute resolution in ${p}'s agreement. Evidence references review procedures and support escalation paths.`,
  data_saas: (p, c) =>
    `The scanner identified ${c} data handling clause${c > 1 ? "s" : ""} in ${p}'s terms. Evidence references data retention, export, and deletion policies.`,
  api: (p, c) =>
    `The scanner found ${c} API-related clause${c > 1 ? "s" : ""} in ${p}'s developer terms. Evidence references rate limits, quota enforcement, and access suspension conditions.`,
  legal: (p, c) =>
    `The scanner identified ${c} legal term clause${c > 1 ? "s" : ""} in ${p}'s agreement. Evidence references arbitration requirements, liability clauses, and waiver provisions.`,
};

function buildSummary(category: string, platformName: string, evidenceCount: number): string {
  const template = CATEGORY_SUMMARY_TEMPLATES[category];
  if (template) return template(platformName, evidenceCount);
  return `The scanner detected ${evidenceCount} policy clause${evidenceCount > 1 ? "s" : ""} in the ${category} category for ${platformName}. Review evidence excerpts for context.`;
}

// ---------------------------------------------------------------------------
// Possible false positive detection
// ---------------------------------------------------------------------------

function detectFalsePositiveWarnings(matches: KeywordMatch[]): string | null {
  const warnings: string[] = [];

  const highNoiseCount = matches.filter((m) => m.noise_score >= 5).length;
  if (highNoiseCount > 0) {
    warnings.push(`${highNoiseCount} match(es) have elevated noise scores — may include navigation or footer text.`);
  }

  const shortExcerpts = matches.filter((m) => m.excerpt.length < 80).length;
  if (shortExcerpts > 0) {
    warnings.push(`${shortExcerpts} match(es) have very short excerpts — may lack sufficient policy context.`);
  }

  return warnings.length > 0 ? warnings.join(" ") : null;
}

// ---------------------------------------------------------------------------
// Suggested risk description (deterministic)
// ---------------------------------------------------------------------------

const RISK_DESCRIPTIONS: Record<string, string> = {
  money: "Risk of unexpected funds being withheld, delayed, or reversed without clear recourse.",
  account: "Risk of account access being restricted, suspended, or closed, potentially trapping funds.",
  kyc: "Risk of operations being paused pending identity verification, causing service interruptions.",
  payout: "Risk of payouts being delayed, reviewed, or withheld based on platform-initiated review.",
  appeal: "Risk of limited ability to challenge platform decisions through a formal, structured process.",
  data_saas: "Risk of loss of access to data or disruption to SaaS services upon account termination.",
  api: "Risk of API access being rate-limited or suspended, disrupting developer integrations.",
  legal: "Risk of unfavorable legal terms limiting dispute options or imposing binding arbitration.",
};

function buildSuggestedRisk(category: string): string {
  return RISK_DESCRIPTIONS[category] ?? "Review policy clauses carefully before relying on this platform for critical operations.";
}

// ---------------------------------------------------------------------------
// AI Prompt Template generation (static — no LLM call)
// ---------------------------------------------------------------------------

export function buildAiPromptTemplate(packet: ResearchPacketWithEvidence): string {
  const evidenceSummary = packet.evidence
    .slice(0, 5)
    .map(
      (e, i) =>
        `Evidence #${i + 1}:\n${e.excerpt.slice(0, 400)}`,
    )
    .join("\n\n");

  return `You are an editorial assistant for PoliBrawl.

Transform this Research Packet into one Red Flag.

Requirements:
- Evidence first
- Neutral tone — do NOT editorialize or express opinions
- No hallucination — only use information from the excerpts below
- No invented claims — stay strictly within the provided evidence
- Concise — aim for 2–4 sentences per section
- Include a survival note with practical advice for users
- Include a 3-item checklist of protective actions
- Include one backup option with platform alternative and tradeoffs
- Preserve evidence meaning — do not paraphrase in a way that changes meaning

Research Packet:
Platform: ${packet.platform_name ?? "Unknown"}
Category: ${packet.category}
Suggested Title: ${packet.title}
Confidence Score: ${packet.confidence_score}/100
Noise Score: ${packet.noise_score}/100
Summary: ${packet.summary ?? "(see evidence)"}
Suggested Level: ${packet.suggested_level ?? "medium"}
Source URL: ${packet.source_url ?? "N/A"}
Keywords Found: ${packet.keywords_found.join(", ")}

Evidence Excerpts:
${evidenceSummary}

Scanner Observations:
${packet.scanner_observations ?? "No additional observations."}

Possible False Positives:
${packet.possible_false_positives ?? "None flagged."}

Required Output Format:
# Red Flag: [Title]

**Platform:** [Name]
**Category:** [Category]
**Level:** [low | medium | high | critical]

## Summary
[2–3 sentences]

## Why It Matters
[2–3 sentences]

## Evidence
[Quote the most relevant excerpt]

## Survival Note
[Practical advice for users]

## Checklist
- [ ] Item 1
- [ ] Item 2
- [ ] Item 3

## Backup Option
**Alternative:** [Name]
**Tradeoffs:** [Brief tradeoff summary]
`;
}

// ---------------------------------------------------------------------------
// Markdown export (static — no LLM call)
// ---------------------------------------------------------------------------

export function exportPacketAsMarkdown(packet: ResearchPacketWithEvidence): string {
  const evidenceSection = packet.evidence
    .map(
      (e, i) => `### Evidence #${i + 1}${e.section_hint ? ` — ${e.section_hint}` : ""}
**Confidence:** ${e.confidence_score}/100 | **Noise:** ${e.noise_score}/100

> ${e.excerpt.replace(/\n/g, "\n> ")}

${e.context_before ? `**Context before:** ...${e.context_before}...` : ""}
${e.context_after ? `**Context after:** ...${e.context_after}...` : ""}
${e.source_url ? `**Source:** ${e.source_url}` : ""}`,
    )
    .join("\n\n---\n\n");

  return `# Research Packet

**Platform:** ${packet.platform_name ?? "Unknown"}
**Category:** ${packet.category}
**Suggested Title:** ${packet.title}
**Status:** ${packet.status}
**Confidence Score:** ${packet.confidence_score}/100
**Noise Score:** ${packet.noise_score}/100
**Generated At:** ${new Date(packet.generated_at).toISOString()}

---

## Summary

${packet.summary ?? "_No summary generated._"}

---

## Suggested Risk

${packet.suggested_risk ?? "_See evidence._"}

---

## Keywords Found

${packet.keywords_found.map((k) => `- \`${k}\``).join("\n")}

---

## Evidence Excerpts

${evidenceSection || "_No evidence items._"}

---

## Scanner Observations

${packet.scanner_observations ?? "_None._"}

---

## Possible False Positives

${packet.possible_false_positives ?? "_None flagged._"}

---

## Source URL

${packet.source_url ?? "_Not recorded._"}

---

_This Research Packet was generated by the PoliBrawl keyword scanner. It is intended for editorial review only and must not be published without human verification._
`;
}

// ---------------------------------------------------------------------------
// Main builder entry point
// ---------------------------------------------------------------------------

interface BuildResearchPacketInput {
  candidateId: Uuid;
  platformId: Uuid;
  platformName: string;
  sourceSnapshotId: Uuid;
  sourceId: Uuid;
  category: string;
}

export async function buildResearchPacketForCandidate(
  input: BuildResearchPacketInput,
): Promise<ResearchPacket | null> {
  const { candidateId, platformId, platformName, sourceSnapshotId, sourceId, category } = input;

  // Idempotent: if packet already exists for this candidate, return it
  const existing = await findResearchPacket({ candidate_id: candidateId });
  if (existing) return existing;

  // Fetch all keyword matches for this category + snapshot
  const allMatches = await listKeywordMatches({
    source_snapshot_id: sourceSnapshotId,
    category,
  });

  if (allMatches.length === 0) return null;

  // Fetch source URL for attribution
  const source = await findSourceById(sourceId);
  const sourceUrl = source?.url ?? null;

  // Score each match excerpt
  const scoredMatches = allMatches.map((m) => {
    const scores = scoreEvidence(
      m.excerpt,
      m.context_before ?? "",
      m.context_after ?? "",
      m.matched_text ? [m.matched_text] : [],
    );
    return { match: m, ...scores };
  });

  // Sort by descending confidence, ascending noise
  scoredMatches.sort((a, b) => {
    const conf = b.confidence - a.confidence;
    if (conf !== 0) return conf;
    return a.noise - b.noise;
  });

  // Aggregate packet-level scores
  const packetScores = aggregatePacketScores(
    scoredMatches.map((s) => ({ confidence: s.confidence, noise: s.noise })),
  );

  // Keywords
  const keywordsFound = [...new Set(allMatches.map((m) => m.keyword))];

  // Suggested title & level
  const suggestedTitle =
    RED_FLAG_SUGGESTED_TITLES[category as keyof typeof RED_FLAG_SUGGESTED_TITLES] ??
    "Red Flag Candidate";
  const suggestedLevel =
    RED_FLAG_SUGGESTED_LEVELS[category as keyof typeof RED_FLAG_SUGGESTED_LEVELS] ??
    "medium";

  // Summary
  const summary = buildSummary(category, platformName, scoredMatches.length);

  // Scanner observations
  const scannerObservations = `Scanner detected ${allMatches.length} keyword match(es) across ${keywordsFound.length} unique keyword(s) in the ${category} category. Top keywords: ${keywordsFound.slice(0, 5).join(", ")}.`;

  // Possible false positives
  const possibleFalsePositives = detectFalsePositiveWarnings(allMatches);

  // Suggested risk
  const suggestedRisk = buildSuggestedRisk(category);

  // Create the packet
  const packet = await createResearchPacket({
    candidate_id: candidateId,
    platform_id: platformId,
    source_snapshot_id: sourceSnapshotId,
    category,
    title: suggestedTitle,
    status: "draft",
    confidence_score: packetScores.confidence,
    noise_score: packetScores.noise,
    summary,
    suggested_level: suggestedLevel,
    suggested_risk: suggestedRisk,
    scanner_observations: scannerObservations,
    possible_false_positives: possibleFalsePositives,
    keywords_found: keywordsFound,
    source_url: sourceUrl,
    generated_at: new Date().toISOString(),
  });

  if (!packet) return null;

  // Insert evidence items (top 10 by confidence, deduplicated)
  const insertedExcerpts = new Set<string>();
  let displayOrder = 0;

  for (const scored of scoredMatches.slice(0, 10)) {
    const m = scored.match;
    // Deduplicate near-identical excerpts (first 100 chars)
    const excerptKey = m.excerpt.slice(0, 100);
    if (insertedExcerpts.has(excerptKey)) continue;
    insertedExcerpts.add(excerptKey);

    const sectionHint = detectSectionHint(m.context_before ?? "");

    await insertResearchPacketEvidence({
      research_packet_id: packet.id,
      keyword_match_id: m.id,
      excerpt: m.excerpt,
      context_before: m.context_before,
      context_after: m.context_after,
      source_url: sourceUrl,
      section_hint: sectionHint,
      confidence_score: scored.confidence,
      noise_score: scored.noise,
      display_order: displayOrder++,
    });
  }

  return packet;
}
