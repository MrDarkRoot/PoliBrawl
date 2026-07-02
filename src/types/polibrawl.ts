export const platformCategories = [
  "payment",
  "creator_freelance",
  "saas_developer",
] as const;

export const platformStatuses = [
  "draft",
  "published",
  "needs_review",
  "archived",
] as const;

export const sourceTypes = [
  "policy",
  "help_center",
  "payout_policy",
  "account_policy",
  "api_policy",
  "appeals_policy",
  "other",
] as const;

export const sourcePriorities = ["core", "supporting", "ignore"] as const;
export const sourceStatuses = [
  "draft",
  "active",
  "archived",
  "failed_capture",
] as const;

export const redFlagCategories = [
  "money",
  "account",
  "kyc",
  "payout",
  "appeal",
  "data_saas",
  "api",
  "legal",
] as const;

export const redFlagLevels = [
  "low",
  "medium",
  "high",
  "critical",
  "unknown",
] as const;

export const redFlagCandidateStatuses = [
  "pending",
  "accepted",
  "rejected_noise",
  "duplicate",
  "needs_more_review",
] as const;

export const redFlagStatuses = [
  "draft",
  "ready_for_review",
  "published",
  "archived",
] as const;

export const evidenceStatuses = ["draft", "approved", "archived"] as const;
export const notePriorities = ["low", "medium", "high"] as const;
export const survivalNoteStatuses = ["draft", "published", "archived"] as const;

export const backupOptionTypes = [
  "alternative_platform",
  "operational_backup",
  "payout_backup",
  "data_export",
  "appeal_path",
  "other",
] as const;

export const backupOptionStatuses = ["draft", "published", "archived"] as const;
export const checklistStatuses = ["draft", "published", "archived"] as const;
export const checklistItemStatuses = ["draft", "published", "archived"] as const;

export const communitySubmissionStatuses = [
  "pending",
  "reviewed",
  "use_as_private_signal",
  "published_summary",
  "rejected",
] as const;

export const platformWatcherStatuses = [
  "pending",
  "active",
  "unsubscribed",
  "bounced",
] as const;

export const correctionStatuses = [
  "pending",
  "reviewing",
  "resolved",
  "rejected",
] as const;

export const correctionIssueTypes = [
  "outdated_policy",
  "wrong_source",
  "incorrect_interpretation",
  "missing_evidence",
  "broken_link",
  "legal_editorial_concern",
  "other",
] as const;

export type Uuid = string;
export type IsoDatetime = string;

export type PlatformCategory = (typeof platformCategories)[number];
export type PlatformStatus = (typeof platformStatuses)[number];
export type SourceType = (typeof sourceTypes)[number];
export type SourcePriority = (typeof sourcePriorities)[number];
export type SourceStatus = (typeof sourceStatuses)[number];
export type RedFlagCategory = (typeof redFlagCategories)[number];
export type RedFlagLevel = (typeof redFlagLevels)[number];
export type RedFlagCandidateStatus = (typeof redFlagCandidateStatuses)[number];
export type RedFlagStatus = (typeof redFlagStatuses)[number];
export type EvidenceStatus = (typeof evidenceStatuses)[number];
export type NotePriority = (typeof notePriorities)[number];
export type SurvivalNoteStatus = (typeof survivalNoteStatuses)[number];
export type BackupOptionType = (typeof backupOptionTypes)[number];
export type BackupOptionStatus = (typeof backupOptionStatuses)[number];
export type ChecklistStatus = (typeof checklistStatuses)[number];
export type ChecklistItemStatus = (typeof checklistItemStatuses)[number];
export type CommunitySubmissionStatus = (typeof communitySubmissionStatuses)[number];
export type PlatformWatcherStatus = (typeof platformWatcherStatuses)[number];
export type CorrectionStatus = (typeof correctionStatuses)[number];
export type CorrectionIssueType = (typeof correctionIssueTypes)[number];

export type BaseRecord = {
  id: Uuid;
  created_at: IsoDatetime;
  updated_at: IsoDatetime;
  archived_at: IsoDatetime | null;
};

export type Platform = BaseRecord & {
  slug: string;
  name: string;
  category: PlatformCategory;
  status: PlatformStatus;
  website_url: string;
  summary: string | null;
  main_level: RedFlagLevel | null;
  disclaimer_text: string | null;
  internal_notes: string | null;
  last_reviewed_at: IsoDatetime | null;
  published_at: IsoDatetime | null;
};

export type Source = BaseRecord & {
  platform_id: Uuid;
  source_type: SourceType;
  priority: SourcePriority;
  title: string;
  url: string | null;
  body_text: string | null;
  status: SourceStatus;
  notes: string | null;
  captured_at: IsoDatetime | null;
  reviewed_at: IsoDatetime | null;
};

export type RedFlagCandidate = BaseRecord & {
  platform_id: Uuid;
  source_id: Uuid;
  category: RedFlagCategory;
  headline: string;
  excerpt: string;
  matched_keywords: string[];
  confidence_note: string | null;
  reviewer_notes: string | null;
  status: RedFlagCandidateStatus;
  reviewed_at: IsoDatetime | null;
};

export type RedFlag = BaseRecord & {
  platform_id: Uuid;
  slug: string;
  title: string;
  category: RedFlagCategory;
  level: RedFlagLevel;
  summary: string;
  why_it_matters: string;
  status: RedFlagStatus;
  reviewed_at: IsoDatetime | null;
  published_at: IsoDatetime | null;
};

export type EvidenceItem = BaseRecord & {
  red_flag_id: Uuid;
  source_id: Uuid;
  excerpt: string;
  source_title: string;
  source_url: string | null;
  notes: string | null;
  sort_order: number;
  status: EvidenceStatus;
  reviewed_at: IsoDatetime | null;
  published_at: IsoDatetime | null;
};

export type SurvivalNote = BaseRecord & {
  red_flag_id: Uuid;
  note_title: string;
  note_body: string;
  priority: NotePriority;
  status: SurvivalNoteStatus;
  published_at: IsoDatetime | null;
};

export type BackupOption = BaseRecord & {
  platform_id: Uuid;
  label: string;
  option_type: BackupOptionType;
  summary: string;
  tradeoffs: string;
  link_url: string | null;
  status: BackupOptionStatus;
  published_at: IsoDatetime | null;
};

export type Checklist = BaseRecord & {
  platform_id: Uuid;
  title: string;
  intro: string | null;
  status: ChecklistStatus;
  published_at: IsoDatetime | null;
};

export type ChecklistItem = BaseRecord & {
  checklist_id: Uuid;
  label: string;
  details: string | null;
  sort_order: number;
  status: ChecklistItemStatus;
  published_at: IsoDatetime | null;
};

export type ReviewRequest = BaseRecord & {
  platform_id: Uuid | null;
  platform_name: string | null;
  email: string | null;
  message: string | null;
  status: CommunitySubmissionStatus;
  reviewed_at: IsoDatetime | null;
};

export type PlatformWatcher = BaseRecord & {
  platform_id: Uuid;
  email: string;
  status: PlatformWatcherStatus;
  subscribed_at: IsoDatetime;
  unsubscribed_at: IsoDatetime | null;
};

export type ExperienceSubmission = BaseRecord & {
  platform_id: Uuid;
  category: RedFlagCategory | "other";
  summary: string;
  country: string | null;
  amount_range: string | null;
  evidence_note: string | null;
  status: CommunitySubmissionStatus;
  reviewed_at: IsoDatetime | null;
  published_at: IsoDatetime | null;
};

export type SurvivalTipSubmission = BaseRecord & {
  platform_id: Uuid;
  tip_summary: string;
  details: string | null;
  status: CommunitySubmissionStatus;
  reviewed_at: IsoDatetime | null;
  published_at: IsoDatetime | null;
};

export type Correction = BaseRecord & {
  platform_id: Uuid | null;
  issue_type: CorrectionIssueType;
  message: string;
  source_url: string | null;
  contact_email: string | null;
  status: CorrectionStatus;
  reviewed_at: IsoDatetime | null;
  resolved_at: IsoDatetime | null;
};

export type CreatePlatformDto = Omit<Platform, "id" | "created_at" | "updated_at" | "archived_at">;
export type UpdatePlatformDto = Partial<CreatePlatformDto>;
export type PublishPlatformDto = {
  status: "published";
  published_at?: IsoDatetime | null;
  last_reviewed_at: IsoDatetime;
  disclaimer_text: string;
};

export type CreateSourceDto = Omit<Source, "id" | "created_at" | "updated_at" | "archived_at">;
export type UpdateSourceDto = Partial<CreateSourceDto>;

export type CreateRedFlagCandidateDto = Omit<RedFlagCandidate, "id" | "created_at" | "updated_at" | "archived_at">;
export type UpdateRedFlagCandidateDto = Partial<CreateRedFlagCandidateDto>;

export type CreateRedFlagDto = Omit<RedFlag, "id" | "created_at" | "updated_at" | "archived_at" | "published_at"> & {
  published_at?: IsoDatetime | null;
};
export type UpdateRedFlagDto = Partial<CreateRedFlagDto>;
export type PublishRedFlagDto = {
  status: "published";
  reviewed_at: IsoDatetime;
  published_at?: IsoDatetime | null;
};

export type CreateEvidenceDto = Omit<EvidenceItem, "id" | "created_at" | "updated_at" | "archived_at" | "published_at"> & {
  published_at?: IsoDatetime | null;
};
export type UpdateEvidenceDto = Partial<CreateEvidenceDto>;
export type PublishEvidenceDto = {
  status: "approved";
  reviewed_at: IsoDatetime;
  published_at?: IsoDatetime | null;
};

export type CreateSurvivalNoteDto = Omit<SurvivalNote, "id" | "created_at" | "updated_at" | "archived_at" | "published_at"> & {
  published_at?: IsoDatetime | null;
};
export type UpdateSurvivalNoteDto = Partial<CreateSurvivalNoteDto>;
export type PublishSurvivalNoteDto = {
  status: "published";
  published_at?: IsoDatetime | null;
};

export type CreateBackupOptionDto = Omit<BackupOption, "id" | "created_at" | "updated_at" | "archived_at" | "published_at"> & {
  published_at?: IsoDatetime | null;
};
export type UpdateBackupOptionDto = Partial<CreateBackupOptionDto>;
export type PublishBackupOptionDto = {
  status: "published";
  published_at?: IsoDatetime | null;
};

export type CreateChecklistDto = Omit<Checklist, "id" | "created_at" | "updated_at" | "archived_at" | "published_at"> & {
  published_at?: IsoDatetime | null;
};
export type UpdateChecklistDto = Partial<CreateChecklistDto>;
export type PublishChecklistDto = {
  status: "published";
  published_at?: IsoDatetime | null;
};

export type CreateChecklistItemDto = Omit<ChecklistItem, "id" | "created_at" | "updated_at" | "archived_at" | "published_at"> & {
  published_at?: IsoDatetime | null;
};
export type UpdateChecklistItemDto = Partial<CreateChecklistItemDto>;
export type PublishChecklistItemDto = {
  status: "published";
  published_at?: IsoDatetime | null;
};

export type CreateReviewRequestDto = Omit<ReviewRequest, "id" | "created_at" | "updated_at" | "archived_at" | "reviewed_at"> & {
  reviewed_at?: IsoDatetime | null;
};
export type UpdateReviewRequestDto = Partial<CreateReviewRequestDto>;

export type CreatePlatformWatcherDto = Omit<PlatformWatcher, "id" | "created_at" | "updated_at" | "archived_at">;
export type UpdatePlatformWatcherDto = Partial<CreatePlatformWatcherDto>;

export type CreateExperienceSubmissionDto = Omit<ExperienceSubmission, "id" | "created_at" | "updated_at" | "archived_at" | "reviewed_at" | "published_at"> & {
  reviewed_at?: IsoDatetime | null;
  published_at?: IsoDatetime | null;
};
export type UpdateExperienceSubmissionDto = Partial<CreateExperienceSubmissionDto>;

export type CreateSurvivalTipSubmissionDto = Omit<SurvivalTipSubmission, "id" | "created_at" | "updated_at" | "archived_at" | "reviewed_at" | "published_at"> & {
  reviewed_at?: IsoDatetime | null;
  published_at?: IsoDatetime | null;
};
export type UpdateSurvivalTipSubmissionDto = Partial<CreateSurvivalTipSubmissionDto>;

export type CreateCorrectionDto = Omit<Correction, "id" | "created_at" | "updated_at" | "archived_at" | "reviewed_at" | "resolved_at"> & {
  reviewed_at?: IsoDatetime | null;
  resolved_at?: IsoDatetime | null;
};
export type UpdateCorrectionDto = Partial<CreateCorrectionDto>;

export type ListQueryOptions = {
  limit?: number;
  offset?: number;
};

export type PlatformListFilters = Partial<
  Pick<Platform, "id" | "slug" | "status" | "category">
> & {
  search?: string;
};
export type SourceListFilters = Partial<
  Pick<Source, "id" | "platform_id" | "status" | "priority" | "source_type">
>;
export type RedFlagCandidateListFilters = Partial<
  Pick<RedFlagCandidate, "id" | "platform_id" | "source_id" | "status" | "category">
>;
export type RedFlagListFilters = Partial<
  Pick<RedFlag, "id" | "platform_id" | "slug" | "status" | "category" | "level">
>;
export type EvidenceListFilters = Partial<
  Pick<EvidenceItem, "id" | "red_flag_id" | "source_id" | "status">
>;
export type SurvivalNoteListFilters = Partial<
  Pick<SurvivalNote, "id" | "red_flag_id" | "status" | "priority">
>;
export type BackupOptionListFilters = Partial<
  Pick<BackupOption, "id" | "platform_id" | "status" | "option_type">
>;
export type ChecklistListFilters = Partial<
  Pick<Checklist, "id" | "platform_id" | "status">
>;
export type ChecklistItemListFilters = Partial<
  Pick<ChecklistItem, "id" | "checklist_id" | "status">
>;
export type ReviewRequestListFilters = Partial<
  Pick<ReviewRequest, "id" | "platform_id" | "status">
>;
export type PlatformWatcherListFilters = Partial<
  Pick<PlatformWatcher, "id" | "platform_id" | "status">
>;
export type ExperienceSubmissionListFilters = Partial<
  Pick<ExperienceSubmission, "id" | "platform_id" | "status" | "category">
>;
export type SurvivalTipSubmissionListFilters = Partial<
  Pick<SurvivalTipSubmission, "id" | "platform_id" | "status">
>;
export type CorrectionListFilters = Partial<
  Pick<Correction, "id" | "platform_id" | "status" | "issue_type">
>;
