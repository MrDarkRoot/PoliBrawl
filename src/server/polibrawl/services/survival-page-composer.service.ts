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
import { evaluatePlatformPublicationReadinessForPage } from "./platform-publication-readiness.service";
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
  const evaluation = await evaluatePlatformPublicationReadinessForPage(pageId);
  const score = Math.max(0, 100 - evaluation.errors.length * 12 - evaluation.warnings.length * 4);

  return {
    pageId,
    platformId: page.platform_id,
    ready_for_publish: evaluation.ready,
    score: Math.round(score),
    errors: evaluation.errors,
    warnings: evaluation.warnings,
    attachedRedFlagsCount: evaluation.attachedRedFlagsCount,
    readyRedFlagsCount: evaluation.publishedRedFlagsCount,
    notReadyRedFlags: evaluation.notReadyRedFlags,
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
