import "server-only";

import { queryMany, queryOne } from "@/server/polibrawl/db";
import type { Uuid, RedFlag, EvidenceItem, SurvivalNote, BackupOption, Checklist, ChecklistItem } from "@/types/polibrawl";

export type QualityEvaluation = {
  score: number;
  warnings: string[];
  errors: string[];
  ready_for_publish: boolean;
};

export async function evaluateDraftRedFlag(redFlagId: Uuid): Promise<QualityEvaluation> {
  const warnings: string[] = [];
  const errors: string[] = [];

  const redFlag = await queryOne<RedFlag>(
    `SELECT * FROM red_flags WHERE id = $1`,
    [redFlagId]
  );

  if (!redFlag) {
    throw new Error("Red flag not found");
  }

  const evidence = await queryMany<EvidenceItem>(
    `SELECT * FROM evidence WHERE red_flag_id = $1 AND status != 'archived'`,
    [redFlagId]
  );

  const notes = await queryMany<SurvivalNote>(
    `SELECT * FROM survival_notes WHERE red_flag_id = $1 AND status != 'archived'`,
    [redFlagId]
  );

  const backupOptions = await queryMany<BackupOption>(
    `SELECT * FROM backup_options WHERE red_flag_id = $1 AND status != 'archived'`,
    [redFlagId]
  );

  const checklists = await queryMany<Checklist>(
    `SELECT * FROM checklists WHERE red_flag_id = $1 AND status != 'archived'`,
    [redFlagId]
  );
  
  const checklistsIds = checklists.map(c => c.id);
  const checklistItems = checklistsIds.length > 0 
    ? await queryMany<ChecklistItem>(
        `SELECT * FROM checklist_items WHERE checklist_id = ANY($1) AND status != 'archived'`,
        [checklistsIds]
      )
    : [];

  // Errors (Blockers)
  if (!redFlag.platform_id) {
    errors.push("Missing Platform");
  }
  if (!redFlag.category) {
    errors.push("Missing Category");
  }
  if (!redFlag.reviewed_at) {
    errors.push("Missing Review Date");
  }
  if (evidence.length === 0) {
    errors.push("Missing Evidence: At least one evidence record is required");
  }
  if (notes.length === 0) {
    errors.push("Missing Notes: At least one survival note is required");
  }
  if (checklistItems.length === 0) {
    errors.push("Missing Checklist: At least one checklist item is required");
  }
  if (!redFlag.source_id) {
    errors.push("Missing Source");
  }
  
  if (redFlag.summary && redFlag.summary.length < 50) {
    errors.push("Too Short Summary: Summary should be at least 50 characters");
  }

  // Warnings
  if (backupOptions.length === 0) {
    warnings.push("Missing Backup Options");
  }
  
  const lowConfidence = evidence.filter(e => e.confidence === 'low');
  if (lowConfidence.length > 0) {
    warnings.push(`Low Confidence Evidence: ${lowConfidence.length} evidence items have low confidence`);
  }

  const uniqueExcerpts = new Set(evidence.map(e => e.excerpt));
  if (uniqueExcerpts.size < evidence.length) {
    warnings.push("Duplicate Evidence: Found duplicate excerpts");
  }

  const ready_for_publish = errors.length === 0;

  // Simple score based on components present
  let score = 100 - (errors.length * 20) - (warnings.length * 10);
  if (score < 0) score = 0;

  return {
    score,
    warnings,
    errors,
    ready_for_publish
  };
}
