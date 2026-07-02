import "server-only";
import { queryMany } from "@/server/polibrawl/db";
import { 
  findPlatformSurvivalPageById, 
  findPlatformSurvivalPageByPlatformId, 
  createPlatformSurvivalPage, 
  updatePlatformSurvivalPage 
} from "../repositories/platform-survival-page.repository";
import { 
  listPageRedFlags, 
  addRedFlagToPage 
} from "../repositories/platform-survival-page-red-flag.repository";
import { evaluateDraftRedFlag } from "./red-flag-quality.service";
import type { Uuid, RedFlag } from "@/types/polibrawl";
import { findPlatformById } from "../repositories/platform.repository";

export type PageQualityEvaluation = {
  pageId: Uuid;
  platformId: Uuid;
  ready_for_publish: boolean;
  score: number;
  errors: string[];
  warnings: string[];
  attachedRedFlagsCount: number;
  readyRedFlagsCount: number;
  notReadyRedFlags: Array<{ id: Uuid; title: string; reasons: string[] }>;
};

export async function evaluatePlatformSurvivalPage(pageId: Uuid): Promise<PageQualityEvaluation> {
  const page = await findPlatformSurvivalPageById(pageId);
  if (!page) throw new Error("Page not found");

  const platform = await findPlatformById(page.platform_id);
  
  const pageRedFlags = await listPageRedFlags(pageId);
  
  const warnings: string[] = [];
  const errors: string[] = [];
  const notReadyRedFlags = [];
  let readyRedFlagsCount = 0;
  let rfScoreSum = 0;

  if (!platform) errors.push("Missing Platform");
  else if (platform.status === 'archived') errors.push("Platform is archived");
  
  if (!page.title) errors.push("Missing Title");
  if (!page.summary) warnings.push("Missing Summary");
  if (!page.disclaimer_note) errors.push("Missing Disclaimer Note");
  if (!page.last_reviewed_at) errors.push("Missing Last Reviewed Date");
  
  if (pageRedFlags.length === 0) {
    errors.push("Missing Red Flags: At least one red flag must be attached");
  } else if (pageRedFlags.length > 7) {
    warnings.push("Too Many Red Flags: Consider keeping the survival page under 7 red flags to prevent user fatigue");
  }

  for (const prf of pageRedFlags) {
    const rf = prf.red_flag;
    if (rf.status === 'archived') {
      errors.push(`Archived Red Flag attached: ${rf.title}`);
      continue;
    }
    const rfEval = await evaluateDraftRedFlag(rf.id);
    if (!rfEval.ready_for_publish) {
      notReadyRedFlags.push({
        id: rf.id,
        title: rf.title,
        reasons: rfEval.errors
      });
      errors.push(`Attached Red Flag "${rf.title}" is not ready for publish`);
    } else {
      readyRedFlagsCount++;
    }
    rfScoreSum += rfEval.score;
  }

  const ready_for_publish = errors.length === 0;
  
  // Calculate average RF score + page deductions
  let score = 100;
  if (pageRedFlags.length > 0) {
    score = rfScoreSum / pageRedFlags.length;
  }
  score = score - (errors.length * 15) - (warnings.length * 5);
  if (score < 0) score = 0;
  if (score > 100) score = 100;

  return {
    pageId,
    platformId: page.platform_id,
    ready_for_publish,
    score: Math.round(score),
    errors,
    warnings,
    attachedRedFlagsCount: pageRedFlags.length,
    readyRedFlagsCount,
    notReadyRedFlags
  };
}

export async function createDefaultSurvivalPageForPlatform(platformId: Uuid) {
  const existing = await findPlatformSurvivalPageByPlatformId(platformId);
  if (existing) return existing;

  const platform = await findPlatformById(platformId);
  if (!platform) throw new Error("Platform not found");

  const page = await createPlatformSurvivalPage({
    platform_id: platformId,
    slug: platform.slug,
    title: `${platform.name} Survival Page`,
    summary: platform.summary || null,
    main_level: "medium",
    status: "draft",
    editorial_intro: null,
    survival_summary: null,
    disclaimer_note: "The information on this page is for general survival awareness. Policies and enforcement can change without notice.",
    last_reviewed_at: null,
    ready_for_publish: false,
  });

  return page;
}

export async function autoAttachReadyRedFlagsToPage(pageId: Uuid) {
  const page = await findPlatformSurvivalPageById(pageId);
  if (!page) throw new Error("Page not found");

  const existingFlags = await listPageRedFlags(pageId);
  const existingIds = new Set(existingFlags.map(f => f.red_flag_id));

  // Find all draft red flags for this platform
  const allFlags = await queryMany<RedFlag>(
    `SELECT * FROM red_flags WHERE platform_id = $1 AND status != 'archived'`,
    [page.platform_id]
  );

  let displayOrder = existingFlags.length;
  let attachedCount = 0;

  for (const rf of allFlags) {
    if (existingIds.has(rf.id)) continue;
    
    const rfEval = await evaluateDraftRedFlag(rf.id);
    if (rfEval.ready_for_publish) {
      await addRedFlagToPage(pageId, rf.id, displayOrder++);
      attachedCount++;
    }
  }

  return attachedCount;
}

export async function updatePageReadiness(pageId: Uuid) {
  const evaluation = await evaluatePlatformSurvivalPage(pageId);
  const page = await findPlatformSurvivalPageById(pageId);
  if (!page) return;
  
  const status = evaluation.ready_for_publish ? "ready_for_publish" : (page.status === "ready_for_publish" ? "needs_review" : page.status);
  
  await updatePlatformSurvivalPage(pageId, {
    ready_for_publish: evaluation.ready_for_publish,
    status
  });

  return evaluation;
}
