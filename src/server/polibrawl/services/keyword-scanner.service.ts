// Keyword Scanner Service — Sprint 4
// Deterministic, traceable, low-noise. No AI. No crawler.
import "server-only";

import {
  findKeywordMatch,
  createKeywordMatch,
  updateKeywordMatch,
} from "@/server/polibrawl/repositories/keyword-match.repository";
import {
  listRedFlagCandidates,
  createCandidateFromKeywordMatches,
} from "@/server/polibrawl/repositories/red-flag-candidate.repository";
import { findSourceSnapshotById } from "@/server/polibrawl/repositories/source-snapshot.repository";
import { findSourceById } from "@/server/polibrawl/repositories/source.repository";
import type { RedFlagCandidate, ScanSnapshotResult, ScanSnapshotWithPacketsResult, Uuid } from "@/types/polibrawl";
import {
  RED_FLAG_KEYWORD_TAXONOMY,
  RED_FLAG_SUGGESTED_TITLES,
  RED_FLAG_SUGGESTED_LEVELS,
} from "@/lib/polibrawl/red-flag-taxonomy";
import { buildResearchPacketForCandidate } from "@/server/polibrawl/services/research-packet-builder.service";

// ---------------------------------------------------------------------------
// Noise scoring — deterministic heuristics only
// ---------------------------------------------------------------------------

const NOISE_PATTERNS: RegExp[] = [
  /https?:\/\//gi,                        // URLs in excerpt
  /cookie\s*policy|privacy\s*policy/i,    // Navigation/footer boilerplate
  /all rights reserved/i,                  // Footer text
];

function computeNoiseScore(
  excerpt: string,
  contextBefore: string,
  contextAfter: string,
): number {
  let score = 0;

  // Many URLs → noisy
  const urlMatches = (excerpt.match(/https?:\/\//gi) ?? []).length;
  score += Math.min(urlMatches * 2, 6);

  // Very short excerpt
  if (excerpt.length < 80) score += 3;

  // Very short combined context — could be nav/footer fragment
  const combined = contextBefore + contextAfter;
  if (combined.length < 40) score += 2;

  // Boilerplate patterns
  for (const pattern of NOISE_PATTERNS) {
    if (pattern.test(excerpt)) score += 1;
  }

  // High link density: many URLs in a short excerpt
  if (urlMatches >= 3 && excerpt.length < 400) score += 3;

  // List/directory style — many commas relative to length
  const commaRatio =
    (excerpt.match(/,/g) ?? []).length / Math.max(excerpt.length, 1);
  if (commaRatio > 0.05) score += 2;

  return score;
}

// ---------------------------------------------------------------------------
// Text matching helpers
// ---------------------------------------------------------------------------

interface RawMatch {
  keyword: string;
  start: number;
  end: number;
  noiseScore: number;
  excerpt: string;
  contextBefore: string;
  contextAfter: string;
}

const EXCERPT_RADIUS = 300;
const CONTEXT_RADIUS = 80;

function isBoundaryChar(c: string): boolean {
  return !/[a-z0-9_]/i.test(c);
}

function findMatchesInText(text: string, keywords: string[]): RawMatch[] {
  const lower = text.toLowerCase();
  const results: RawMatch[] = [];

  for (const keyword of keywords) {
    const lk = keyword.toLowerCase();
    let pos = 0;

    while ((pos = lower.indexOf(lk, pos)) !== -1) {
      const charBefore = pos > 0 ? lower[pos - 1] : " ";
      const charAfter =
        pos + lk.length < lower.length ? lower[pos + lk.length] : " ";

      if (isBoundaryChar(charBefore) && isBoundaryChar(charAfter)) {
        const excerptStart = Math.max(0, pos - EXCERPT_RADIUS);
        const excerptEnd = Math.min(
          text.length,
          pos + lk.length + EXCERPT_RADIUS,
        );
        const excerpt = text
          .slice(excerptStart, excerptEnd)
          .replace(/\s+/g, " ")
          .trim();

        const ctxBefore = text
          .slice(Math.max(0, pos - CONTEXT_RADIUS), pos)
          .replace(/\s+/g, " ")
          .trim();
        const ctxAfter = text
          .slice(
            pos + lk.length,
            Math.min(text.length, pos + lk.length + CONTEXT_RADIUS),
          )
          .replace(/\s+/g, " ")
          .trim();

        const noise = computeNoiseScore(excerpt, ctxBefore, ctxAfter);

        results.push({
          keyword,
          start: pos,
          end: pos + lk.length,
          noiseScore: noise,
          excerpt,
          contextBefore: ctxBefore,
          contextAfter: ctxAfter,
        });
      }

      pos += lk.length;
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function scanSourceSnapshotForKeywords(input: {
  sourceSnapshotId: Uuid;
  createCandidates?: boolean;
}): Promise<ScanSnapshotResult> {
  const { sourceSnapshotId, createCandidates = true } = input;

  const snapshot = await findSourceSnapshotById(sourceSnapshotId);
  if (!snapshot) {
    throw new Error(`Snapshot not found: ${sourceSnapshotId}`);
  }

  const extractedText = snapshot.extracted_text;
  if (!extractedText || extractedText.trim().length === 0) {
    throw new Error(
      `Snapshot ${sourceSnapshotId} has no extracted text to scan.`,
    );
  }

  const source = await findSourceById(snapshot.source_id);
  if (!source) {
    throw new Error(`Source not found for snapshot: ${sourceSnapshotId}`);
  }

  const sourceId = source.id;
  const platformId = source.platform_id;

  const result: ScanSnapshotWithPacketsResult = {
    sourceSnapshotId,
    sourceId,
    platformId,
    totalMatchesFound: 0,
    matchesInserted: 0,
    duplicatesSkipped: 0,
    candidatesCreated: 0,
    categoriesFound: [],
    warnings: [],
    packetsGenerated: 0,
  };

  for (const [category, keywords] of Object.entries(RED_FLAG_KEYWORD_TAXONOMY)) {
    const rawMatches = findMatchesInText(extractedText, keywords);

    if (rawMatches.length === 0) continue;

    result.categoriesFound.push(category);
    result.totalMatchesFound += rawMatches.length;

    // -----------------------------------------------------------------
    // Insert keyword_matches, deduplicating by (snapshot_id, keyword)
    // -----------------------------------------------------------------
    const createdMatchIds: Uuid[] = [];
    const matchedKeywordsSet = new Set<string>();

    for (const m of rawMatches) {
      // One match per unique keyword per snapshot is enough for grouping.
      // Skip if we already inserted this keyword for this snapshot.
      if (matchedKeywordsSet.has(m.keyword)) {
        result.duplicatesSkipped++;
        continue;
      }

      // Check DB for pre-existing match with same snapshot + keyword
      const existing = await findKeywordMatch({
        source_snapshot_id: sourceSnapshotId,
        keyword: m.keyword,
      });

      if (existing) {
        result.duplicatesSkipped++;
        matchedKeywordsSet.add(m.keyword);
        createdMatchIds.push(existing.id);
        continue;
      }

      const km = await createKeywordMatch({
        source_snapshot_id: sourceSnapshotId,
        source_id: sourceId,
        platform_id: platformId,
        category,
        keyword: m.keyword,
        matched_text: extractedText.slice(m.start, m.end),
        excerpt: m.excerpt,
        context_before: m.contextBefore || null,
        context_after: m.contextAfter || null,
        start_offset: m.start,
        end_offset: m.end,
        confidence: 1,
        noise_score: m.noiseScore,
        status: "pending",
        candidate_id: null,
      });

      if (!km) continue;

      result.matchesInserted++;
      createdMatchIds.push(km.id);
      matchedKeywordsSet.add(m.keyword);
    }

    if (createdMatchIds.length === 0) continue;

    // -----------------------------------------------------------------
    // Candidate grouping: at most ONE candidate per category per snapshot
    // -----------------------------------------------------------------
    if (!createCandidates) continue;

    const existingCandidates = await listRedFlagCandidates({
      source_snapshot_id: sourceSnapshotId,
      category: category as RedFlagCandidate["category"],
    });

    if (existingCandidates.length > 0) continue;

    const suggestedTitle =
      RED_FLAG_SUGGESTED_TITLES[
        category as keyof typeof RED_FLAG_SUGGESTED_TITLES
      ] ?? "Red Flag Candidate";
    const suggestedLevel =
      RED_FLAG_SUGGESTED_LEVELS[
        category as keyof typeof RED_FLAG_SUGGESTED_LEVELS
      ] ?? "unknown";

    // Use lowest-noise match's excerpt for the candidate
    const sortedByNoise = [...rawMatches].sort(
      (a, b) => a.noiseScore - b.noiseScore,
    );
    const bestExcerpt =
      sortedByNoise[0]?.excerpt ?? rawMatches[0].excerpt;
    const primaryMatchId = createdMatchIds[0];

    try {
      const candidate = await createCandidateFromKeywordMatches({
        platformId,
        sourceId,
        sourceSnapshotId,
        category,
        primaryKeywordMatchId: primaryMatchId,
        matchedKeywords: Array.from(matchedKeywordsSet),
        excerpt: bestExcerpt,
        suggestedTitle,
        suggestedLevel,
      });

      result.candidatesCreated++;

      // Back-link all keyword_matches for this category to the candidate
      for (const matchId of createdMatchIds) {
        await updateKeywordMatch(matchId, {
          candidate_id: candidate.id,
          status: "grouped",
        });
      }

      // Build Research Packet for this candidate
      try {
        const sourceRecord = await findSourceById(sourceId);
        const platformName = sourceRecord?.title ?? platformId;
        const packet = await buildResearchPacketForCandidate({
          candidateId: candidate.id,
          platformId,
          platformName,
          sourceSnapshotId,
          sourceId,
          category,
        });
        if (packet) result.packetsGenerated++;
      } catch (packetErr) {
        const msg = packetErr instanceof Error ? packetErr.message : "Packet build error";
        result.warnings.push(`Research packet for category ${category}: ${msg}`);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Unknown candidate creation error";
      result.warnings.push(`Category ${category}: ${msg}`);
    }
  }

  return result;
}
