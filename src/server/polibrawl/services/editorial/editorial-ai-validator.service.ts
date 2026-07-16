import { validateEditorialField } from "@/server/polibrawl/services/editorial/editorial-quality-validator";
import type {
  EditorialDraftBackupOption,
  EditorialDraftStatus,
  Uuid,
} from "@/types/polibrawl";
import type { EditorialDraftTemplateOutput } from "@/server/polibrawl/services/editorial/templates/shared";

const forbiddenClaimFragments = [
  "guaranteed",
  "will recover",
  "always",
  "never",
  "legal advice",
  "we promise",
] as const;

export type EditorialAiDraftCandidate = EditorialDraftTemplateOutput & {
  evidence_reference_ids: readonly Uuid[];
};

export type EditorialAiValidationResult = {
  ok: boolean;
  errors: string[];
};

function hasForbiddenClaim(text: string) {
  const normalized = text.toLowerCase();
  return forbiddenClaimFragments.find((fragment) => normalized.includes(fragment));
}

function validateLineItems(label: string, values: readonly string[]) {
  const errors: string[] = [];

  if (values.length === 0) {
    errors.push(`${label} must include at least one item.`);
    return errors;
  }

  values.forEach((value, index) => {
    errors.push(
      ...validateEditorialField({
        label: `${label} item ${index + 1}`,
        value,
        required: true,
        minLength: 5,
      }),
    );
  });

  return errors;
}

function validateBackupOptions(options: readonly EditorialDraftBackupOption[]) {
  const errors: string[] = [];

  if (options.length === 0) {
    return ["Backup options must include at least one option."];
  }

  options.forEach((option, index) => {
    errors.push(
      ...validateEditorialField({
        label: `Backup option ${index + 1} label`,
        value: option.label,
        required: true,
        minLength: 2,
      }),
    );
    errors.push(
      ...validateEditorialField({
        label: `Backup option ${index + 1} tradeoff`,
        value: option.tradeoff,
        required: true,
        minLength: 10,
      }),
    );
  });

  return errors;
}

export function validateEditorialAiDraftCandidate(
  candidate: EditorialAiDraftCandidate,
  availableEvidenceIds: readonly Uuid[],
): EditorialAiValidationResult {
  const errors = [
    ...validateEditorialField({
      label: "Draft title",
      value: candidate.title,
      required: true,
      minLength: 5,
    }),
    ...validateEditorialField({
      label: "Draft summary",
      value: candidate.summary,
      required: true,
      minLength: 40,
    }),
    ...validateLineItems("Who is affected", candidate.who_is_affected),
    ...validateEditorialField({
      label: "Why it matters",
      value: candidate.why_it_matters,
      required: true,
      minLength: 40,
    }),
    ...validateLineItems("Survival actions", candidate.survival_actions),
    ...validateLineItems("Checklist items", candidate.checklist_items),
    ...validateBackupOptions(candidate.backup_options),
    ...validateEditorialField({
      label: "Evidence summary",
      value: candidate.evidence_summary,
      required: true,
      minLength: 20,
    }),
  ];

  const allText = [
    candidate.title,
    candidate.summary,
    ...candidate.who_is_affected,
    candidate.why_it_matters,
    ...candidate.survival_actions,
    ...candidate.checklist_items,
    candidate.evidence_summary,
    ...candidate.backup_options.flatMap((option) => [option.label, option.tradeoff]),
  ].join("\n");

  const forbiddenClaim = hasForbiddenClaim(allText);
  if (forbiddenClaim) {
    errors.push(`Draft contains forbidden claim language: "${forbiddenClaim}".`);
  }

  if (candidate.evidence_reference_ids.length === 0) {
    errors.push("Draft must reference at least one evidence excerpt.");
  }

  const knownEvidenceIds = new Set(availableEvidenceIds);
  const missingEvidenceIds = candidate.evidence_reference_ids.filter(
    (id) => !knownEvidenceIds.has(id),
  );

  if (missingEvidenceIds.length > 0) {
    errors.push(
      `Draft references unknown evidence items: ${missingEvidenceIds.join(", ")}.`,
    );
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function getDraftStatusForIntent(
  currentStatus: EditorialDraftStatus,
  intent: string | null | undefined,
) {
  if (!intent || intent === "save") {
    return currentStatus;
  }

  return intent as EditorialDraftStatus;
}
