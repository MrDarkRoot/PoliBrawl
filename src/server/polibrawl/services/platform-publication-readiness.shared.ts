import {
  validatePublishedBackupOption,
  validatePublishedDependencyScore,
  validatePublishedEvidenceConfidence,
  validatePublishedEvidenceItem,
  validatePublishedPlatformPageCopy,
  validatePublishedRedFlag,
  validatePublishedResolutionRoute,
  validatePublishedRiskTimeline,
  validatePublishedSurvivalNote,
} from "@/server/polibrawl/services/editorial/editorial-quality-validator";
import type {
  BackupOption,
  Checklist,
  ChecklistItem,
  DependencyScore,
  EvidenceConfidence,
  EvidenceItem,
  Platform,
  PlatformSurvivalPage,
  RedFlag,
  ResolutionRoute,
  RiskTimeline,
  SurvivalNote,
  Uuid,
} from "@/types/polibrawl";

export type PublicReadyRedFlag = {
  redFlag: RedFlag;
  evidence: EvidenceItem[];
  survivalNotes: SurvivalNote[];
  backupOptions: BackupOption[];
  checklists: Checklist[];
  checklistItems: ChecklistItem[];
};

export type PlatformPublicationSnapshot = {
  platform: Platform | null;
  survivalPage: PlatformSurvivalPage | null;
  officialSourcesCount: number;
  pageRedFlags: PublicReadyRedFlag[];
  publishedDependencyScores: DependencyScore[];
  publishedEvidenceConfidence: EvidenceConfidence[];
  publishedRiskTimelines: RiskTimeline[];
  publishedResolutionRoutes: ResolutionRoute[];
};

export type PlatformPublicationReadiness = {
  ready: boolean;
  errors: string[];
  warnings: string[];
  attachedRedFlagsCount: number;
  publishedRedFlagsCount: number;
  notReadyRedFlags: Array<{ id: Uuid; title: string; reasons: string[] }>;
};

export function evaluatePlatformPublicationSnapshot(
  snapshot: PlatformPublicationSnapshot,
): PlatformPublicationReadiness {
  const errors: string[] = [];
  const warnings: string[] = [];
  const notReadyRedFlags: PlatformPublicationReadiness["notReadyRedFlags"] = [];

  if (!snapshot.platform) {
    errors.push("Missing platform record.");
  }

  if (!snapshot.survivalPage) {
    errors.push("Missing platform survival page.");
  }

  if (snapshot.platform && snapshot.survivalPage) {
    errors.push(
      ...validatePublishedPlatformPageCopy({
        platform: snapshot.platform,
        survivalPage: snapshot.survivalPage,
      }),
    );
  }

  if (snapshot.officialSourcesCount === 0) {
    errors.push("Missing active official source for this platform.");
  }

  if (snapshot.pageRedFlags.length === 0) {
    errors.push("Missing attached red flags on the survival page.");
  }

  let publishedRedFlagsCount = 0;

  snapshot.pageRedFlags.forEach((item) => {
    const reasons: string[] = [];

    if (item.redFlag.archived_at || item.redFlag.status === "archived") {
      reasons.push(`Red flag "${item.redFlag.title}" is archived.`);
    }

    if (item.redFlag.status !== "published") {
      reasons.push(`Red flag "${item.redFlag.title}" is not published.`);
    }

    reasons.push(...validatePublishedRedFlag(item.redFlag));

    if (item.evidence.length === 0) {
      reasons.push(`Missing published evidence for red flag "${item.redFlag.title}".`);
    } else {
      item.evidence.forEach((evidence) => {
        reasons.push(...validatePublishedEvidenceItem(item.redFlag.title, evidence));
      });
    }

    if (item.survivalNotes.length === 0) {
      reasons.push(`Missing published survival notes for red flag "${item.redFlag.title}".`);
    } else {
      item.survivalNotes.forEach((note) => {
        reasons.push(...validatePublishedSurvivalNote(item.redFlag.title, note));
      });
    }

    if (item.checklists.length === 0) {
      reasons.push(`Missing published checklist for red flag "${item.redFlag.title}".`);
    }

    if (item.checklistItems.length === 0) {
      reasons.push(`Missing published checklist items for red flag "${item.redFlag.title}".`);
    }

    item.backupOptions.forEach((backupOption) => {
      reasons.push(...validatePublishedBackupOption(item.redFlag.title, backupOption));
    });

    if (reasons.length > 0) {
      notReadyRedFlags.push({
        id: item.redFlag.id,
        title: item.redFlag.title,
        reasons,
      });
      errors.push(...reasons);
      return;
    }

    publishedRedFlagsCount += 1;
  });

  if (snapshot.publishedDependencyScores.length > 1) {
    errors.push("Only one published dependency score may exist per platform.");
  }

  snapshot.publishedDependencyScores.forEach((record) => {
    errors.push(...validatePublishedDependencyScore(record));
  });

  if (snapshot.publishedEvidenceConfidence.length > 1) {
    errors.push("Only one published evidence confidence record may exist per platform.");
  }

  snapshot.publishedEvidenceConfidence.forEach((record) => {
    errors.push(...validatePublishedEvidenceConfidence(record));
  });

  snapshot.publishedRiskTimelines.forEach((timeline) => {
    errors.push(...validatePublishedRiskTimeline(timeline));
  });

  snapshot.publishedResolutionRoutes.forEach((route) => {
    errors.push(...validatePublishedResolutionRoute(route));
  });

  if (snapshot.publishedResolutionRoutes.length === 0) {
    warnings.push("No published resolution routes are available for this platform yet.");
  }

  return {
    ready: errors.length === 0,
    errors,
    warnings,
    attachedRedFlagsCount: snapshot.pageRedFlags.length,
    publishedRedFlagsCount,
    notReadyRedFlags,
  };
}
