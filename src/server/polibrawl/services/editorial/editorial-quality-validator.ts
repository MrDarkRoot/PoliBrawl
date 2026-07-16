import { isSafeHttpUrl } from "@/features/shared/schemas/http-url";
import type {
  BackupOption,
  DependencyScore,
  EvidenceConfidence,
  EvidenceItem,
  Platform,
  PolicyChange,
  PlatformSurvivalPage,
  RedFlag,
  ResolutionRoute,
  RiskTimeline,
  SurvivalNote,
} from "@/types/polibrawl";

const placeholderFragments = [
  "minimum length",
  "constraint",
  "placeholder",
  "generated",
  "analysis reveals",
  "summary needs",
  "policy document",
  "critical control regarding",
  "database",
  "candidate",
  "scanner",
  "research packet",
  "noise score",
  "confidence score",
  "summary meets the",
  "being reviewed by the polibrawl editorial team",
  "official survival overview",
  "editorial team",
  "review the official evidence",
  "this policy area may affect",
  "ensure your operations comply",
  "operational continuity depends on",
  "no detailed risk profiles have been published yet",
];

const unsupportedClaimFragments = [
  "guaranteed recovery",
  "guaranteed outcome",
  "guarantees recovery",
  "guarantees an outcome",
  "will recover your money",
  "will recover funds",
  "will recover your funds",
  "will return your funds",
  "funds will return",
  "certain recovery",
  "promise of recovery",
  "refund guaranteed",
];

function normalizeText(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function includesBlockedFragment(value: string, fragments: readonly string[]) {
  const lowerValue = value.toLowerCase();
  return fragments.some((fragment) => lowerValue.includes(fragment));
}

export function validateEditorialField(input: {
  label: string;
  value: string | null | undefined;
  required?: boolean;
  minLength?: number;
}) {
  const value = normalizeText(input.value);
  const issues: string[] = [];

  if (!value) {
    if (input.required) {
      issues.push(`${input.label} is required.`);
    }

    return issues;
  }

  if (typeof input.minLength === "number" && value.length < input.minLength) {
    issues.push(`${input.label} must be at least ${input.minLength} characters.`);
  }

  if (includesBlockedFragment(value, placeholderFragments)) {
    issues.push(`${input.label} contains placeholder or internal-only copy.`);
  }

  if (includesBlockedFragment(value, unsupportedClaimFragments)) {
    issues.push(`${input.label} contains unsupported certainty or guarantee language.`);
  }

  return issues;
}

export function validatePublicUrlField(label: string, value: string | null | undefined) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return [];
  }

  return isSafeHttpUrl(normalized) ? [] : [`${label} must use an http or https URL.`];
}

export function validatePublishedRedFlag(redFlag: RedFlag) {
  return [
    ...validateEditorialField({
      label: `Red flag "${redFlag.title}" summary`,
      value: redFlag.summary,
      required: true,
      minLength: 50,
    }),
    ...validateEditorialField({
      label: `Red flag "${redFlag.title}" why it matters`,
      value: redFlag.why_it_matters,
      required: true,
      minLength: 40,
    }),
    ...(redFlag.reviewed_at ? [] : [`Red flag "${redFlag.title}" is missing a reviewed_at date.`]),
    ...(redFlag.source_id ? [] : [`Red flag "${redFlag.title}" is missing its primary source.`]),
  ];
}

export function validatePublishedEvidenceItem(redFlagTitle: string, evidence: EvidenceItem) {
  return [
    ...validateEditorialField({
      label: `Evidence title for "${redFlagTitle}"`,
      value: evidence.source_title,
      required: true,
      minLength: 2,
    }),
    ...validateEditorialField({
      label: `Evidence excerpt for "${redFlagTitle}"`,
      value: evidence.excerpt,
      required: true,
      minLength: 20,
    }),
    ...validatePublicUrlField(`Evidence source URL for "${redFlagTitle}"`, evidence.source_url),
  ];
}

export function validatePublishedSurvivalNote(redFlagTitle: string, note: SurvivalNote) {
  return [
    ...validateEditorialField({
      label: `Survival note title for "${redFlagTitle}"`,
      value: note.note_title,
      required: true,
      minLength: 4,
    }),
    ...validateEditorialField({
      label: `Survival note body for "${redFlagTitle}"`,
      value: note.note_body,
      required: true,
      minLength: 20,
    }),
  ];
}

export function validatePublishedBackupOption(redFlagTitle: string, backup: BackupOption) {
  return [
    ...validateEditorialField({
      label: `Backup option summary for "${redFlagTitle}"`,
      value: backup.summary,
      required: true,
      minLength: 20,
    }),
    ...validateEditorialField({
      label: `Backup option tradeoffs for "${redFlagTitle}"`,
      value: backup.tradeoffs,
      required: true,
      minLength: 20,
    }),
    ...validatePublicUrlField(`Backup option link for "${redFlagTitle}"`, backup.link_url),
  ];
}

export function validatePublishedResolutionRoute(route: ResolutionRoute) {
  return [
    ...validateEditorialField({
      label: `Resolution route organization for "${route.organization_name}"`,
      value: route.organization_name,
      required: true,
      minLength: 2,
    }),
    ...validateEditorialField({
      label: `Resolution route verification source for "${route.organization_name}"`,
      value: route.verification_source,
      required: true,
      minLength: 10,
    }),
    ...validatePublicUrlField(
      `Resolution route official URL for "${route.organization_name}"`,
      route.official_url,
    ),
    ...(route.last_verified_at
      ? []
      : [`Resolution route "${route.organization_name}" is missing last_verified_at.`]),
  ];
}

export function validatePublishedDependencyScore(score: DependencyScore) {
  return [
    ...(score.factors.length > 0 ? [] : ["Published dependency score must include at least one factor."]),
    ...validateEditorialField({
      label: "Dependency score explanation",
      value: score.explanation,
      required: true,
      minLength: 20,
    }),
  ];
}

export function validatePublishedEvidenceConfidence(confidence: EvidenceConfidence) {
  return [
    ...(confidence.factors.length > 0
      ? []
      : ["Published evidence confidence must include at least one factor."]),
    ...(confidence.last_verified_at
      ? []
      : ["Published evidence confidence is missing last_verified_at."]),
  ];
}

export function validatePublishedRiskTimeline(timeline: RiskTimeline) {
  const issues = [
    ...validateEditorialField({
      label: `Risk timeline "${timeline.title}" source`,
      value: timeline.source,
      required: true,
      minLength: 10,
    }),
  ];

  if (!Array.isArray(timeline.events) || timeline.events.length === 0) {
    issues.push(`Risk timeline "${timeline.title}" must include at least one event.`);
    return issues;
  }

  timeline.events.forEach((event, index) => {
    issues.push(
      ...validateEditorialField({
        label: `Risk timeline "${timeline.title}" event ${index + 1} label`,
        value: event.label,
        required: true,
        minLength: 1,
      }),
    );
    issues.push(
      ...validateEditorialField({
        label: `Risk timeline "${timeline.title}" event ${index + 1} detail`,
        value: event.detail,
        required: true,
        minLength: 10,
      }),
    );
  });

  return issues;
}

export function validatePublishedPolicyChange(change: PolicyChange) {
  return [
    ...validateEditorialField({
      label: "Policy change summary",
      value: change.summary,
      required: true,
      minLength: 20,
    }),
    ...validateEditorialField({
      label: "Policy change what changed",
      value: change.what_changed,
      required: true,
      minLength: 40,
    }),
    ...validateEditorialField({
      label: "Policy change why it matters",
      value: change.why_it_matters,
      required: true,
      minLength: 30,
    }),
    ...(change.who_is_affected.length > 0
      ? []
      : ["Published policy change must identify who is affected."]),
    ...(change.what_to_do.length > 0
      ? []
      : ["Published policy change must include an action checklist."]),
    ...(change.source_id ? [] : ["Published policy change is missing its official source reference."]),
    ...(change.old_snapshot_id ? [] : ["Published policy change is missing its previous snapshot reference."]),
    ...(change.new_snapshot_id ? [] : ["Published policy change is missing its current snapshot reference."]),
    ...(change.reviewed_at ? [] : ["Published policy change is missing reviewed_at."]),
  ];
}

export function validatePublishedPlatformPageCopy(input: {
  platform: Platform;
  survivalPage: PlatformSurvivalPage;
}) {
  const issues = [
    ...validateEditorialField({
      label: `${input.platform.name} platform summary`,
      value: input.platform.summary,
      required: !input.survivalPage.survival_summary,
      minLength: 40,
    }),
    ...validateEditorialField({
      label: `${input.platform.name} page title`,
      value: input.survivalPage.title,
      required: true,
      minLength: 4,
    }),
    ...validateEditorialField({
      label: `${input.platform.name} survival summary`,
      value: input.survivalPage.survival_summary,
      required: !input.platform.summary,
      minLength: 40,
    }),
    ...validateEditorialField({
      label: `${input.platform.name} disclaimer`,
      value: input.survivalPage.disclaimer_note,
      required: true,
      minLength: 20,
    }),
    ...validatePublicUrlField(`${input.platform.name} website URL`, input.platform.website_url),
  ];

  if (!input.survivalPage.last_reviewed_at) {
    issues.push(`${input.platform.name} survival page is missing last_reviewed_at.`);
  }

  return issues;
}
