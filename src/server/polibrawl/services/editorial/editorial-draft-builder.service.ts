import "server-only";

import { findPlatformById } from "@/server/polibrawl/repositories/platform.repository";
import { findRedFlagById } from "@/server/polibrawl/repositories/red-flag.repository";
import { listResearchPacketsWithPlatform } from "@/server/polibrawl/repositories/research-packet.repository";
import { EDITORIAL_STYLE_GUIDE } from "./style-guide";
import type { Uuid } from "@/types/polibrawl";

export interface PlatformGuideDraft {
  title: string;
  executiveSummary: string;
  tldr: string[];
  whoShouldRead: string[];
  riskOverview: string;
  riskSections: { title: string; severity: string; explanation: string; typicalSituations: string; operationalImpact: string; }[];
  survivalStrategy: string;
  actionChecklist: string[];
  backupOptions: string[];
  evidenceReferences: { packetId: string; sourceUrl: string | null; title: string; }[];
  methodology: string;
}

export interface RedFlagDraft {
  headline: string;
  summary: string;
  whyItMatters: string;
  whoIsAffected: string[];
  realWorldScenario: string;
  survivalAdvice: string;
  checklist: string[];
  alternatives: string[];
  evidence: { title: string; sourceUrl: string; excerpt: string; date: string; }[];
  references: string[];
}

export async function buildPlatformGuideDraft(platformId: Uuid): Promise<PlatformGuideDraft> {
  const platform = await findPlatformById(platformId);
  if (!platform) throw new Error("Platform not found");

  // Fetch approved research packets for this platform
  // We use the packets to source the raw material that hasn't been edited yet
  const packets = await listResearchPacketsWithPlatform({ platform_id: platformId, status: 'ready' });

  // Infer audience from platform category
  const audience = EDITORIAL_STYLE_GUIDE.audienceProfiles[platform.category as keyof typeof EDITORIAL_STYLE_GUIDE.audienceProfiles] || ["Users", "Businesses"];

  const riskSections = packets.map(p => ({
    title: p.title || p.candidate_headline || "Unknown Risk",
    severity: p.suggested_level || "medium",
    explanation: p.summary || "No explanation provided.",
    typicalSituations: p.scanner_observations || "N/A",
    operationalImpact: `Risk level: ${p.suggested_level || 'Unknown'}. Category: ${p.category}.`,
  }));

  const evidenceReferences = packets.map(p => ({
    packetId: p.id,
    sourceUrl: p.source_url,
    title: p.title || p.candidate_headline,
  }));

  return {
    title: `${platform.name} Platform Survival Guide`,
    executiveSummary: `[DRAFT INSTRUCTION: Write a neutral, evidence-first 2-3 paragraph summary explaining what users should know about ${platform.name}'s policy risks based on the approved research.]`,
    tldr: [
      "[DRAFT INSTRUCTION: Bullet 1 - Max 5 bullets]",
      "[DRAFT INSTRUCTION: Bullet 2]",
      "[DRAFT INSTRUCTION: Bullet 3]",
    ],
    whoShouldRead: audience,
    riskOverview: `[DRAFT INSTRUCTION: Summarize the risk landscape for ${platform.name}]`,
    riskSections,
    survivalStrategy: `[DRAFT INSTRUCTION: Write practical, non-legal, non-fear-based guidance on surviving ${platform.name}.]`,
    actionChecklist: [
      "[DRAFT INSTRUCTION: Actionable checkbox item 1]",
      "[DRAFT INSTRUCTION: Actionable checkbox item 2]",
    ],
    backupOptions: [
      "[DRAFT INSTRUCTION: Compare alternatives with pros, cons, and trade-offs.]"
    ],
    evidenceReferences,
    methodology: `Evidence-first, independent analysis. Not legal advice. Not affiliated with ${platform.name}.`,
  };
}

export async function buildRedFlagDraft(redFlagId: Uuid): Promise<RedFlagDraft> {
  const redFlag = await findRedFlagById(redFlagId);
  if (!redFlag) throw new Error("Red Flag not found");

  const platform = await findPlatformById(redFlag.platform_id);
  const audience = platform ? (EDITORIAL_STYLE_GUIDE.audienceProfiles[platform.category as keyof typeof EDITORIAL_STYLE_GUIDE.audienceProfiles] || []) : [];

  return {
    headline: redFlag.title,
    summary: redFlag.summary || `[DRAFT INSTRUCTION: Summarize the ${redFlag.title} risk]`,
    whyItMatters: redFlag.why_it_matters || `[DRAFT INSTRUCTION: Explain why ${redFlag.title} matters operationally]`,
    whoIsAffected: audience,
    realWorldScenario: `[DRAFT INSTRUCTION: Provide a neutral real-world scenario for ${redFlag.title}]`,
    survivalAdvice: `[DRAFT INSTRUCTION: Provide survival guidance, not legal advice]`,
    checklist: [
      "[DRAFT INSTRUCTION: Actionable checkbox item 1]",
      "[DRAFT INSTRUCTION: Actionable checkbox item 2]",
    ],
    alternatives: [
      "[DRAFT INSTRUCTION: Alternative options]"
    ],
    evidence: [],
    references: [],
  };
}
