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
  "terms",
  "user_agreement",
  "payment_terms",
  "payout_terms",
  "account_limits",
  "kyc_verification",
  "refund_chargeback",
  "developer_api",
  "privacy_data",
  "pricing_fees",
  "appeals",
  "other",
] as const;

export const sourcePriorities = ["core", "supporting", "ignore"] as const;
export const sourceStatuses = [
  "draft",
  "active",
  "archived",
  "failed_capture",
] as const;
export const captureMethods = ["fetch", "paste"] as const;
export const captureStatuses = ["succeeded", "failed"] as const;

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
  "reviewing",
  "approved",
  "rejected",
  "merged",
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
export const intelligenceStatuses = ["draft", "published", "archived"] as const;
export const policyChangeStatuses = [
  "draft",
  "reviewed",
  "published",
  "archived",
] as const;
export const policyChangeImpactLevels = [
  "low",
  "medium",
  "high",
  "critical",
  "unknown",
] as const;
export const policyAlertStatuses = ["unread", "read"] as const;
export const editorialDraftTypes = [
  "platform_survival_guide",
  "red_flag_analysis",
  "policy_change_summary",
] as const;
export const editorialDraftStatuses = [
  "draft",
  "review_requested",
  "approved",
  "published",
  "rejected",
] as const;

export const researchPacketStatuses = ["draft", "ready", "archived"] as const;
export type ResearchPacketStatus = (typeof researchPacketStatuses)[number];

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
export type CaptureMethod = (typeof captureMethods)[number];
export type CaptureStatus = (typeof captureStatuses)[number];
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
export type IntelligenceStatus = (typeof intelligenceStatuses)[number];
export type PolicyChangeStatus = (typeof policyChangeStatuses)[number];
export type PolicyChangeImpactLevel = (typeof policyChangeImpactLevels)[number];
export type PolicyAlertStatus = (typeof policyAlertStatuses)[number];
export type EditorialDraftType = (typeof editorialDraftTypes)[number];
export type EditorialDraftStatus = (typeof editorialDraftStatuses)[number];
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
  last_checked_at: IsoDatetime | null;
  last_reviewed_at: IsoDatetime | null;
  captured_at: IsoDatetime | null;
  reviewed_at: IsoDatetime | null;
  preferred_acquisition_method: string | null;
  last_acquisition_status: string | null;
  last_acquisition_error: string | null;
  acquisition_notes: string | null;
};

export type SourceSnapshot = {
  id: Uuid;
  source_id: Uuid;
  capture_method: CaptureMethod;
  original_url: string | null;
  final_url: string | null;
  http_status: number | null;
  content_type: string | null;
  content_hash: string | null;
  title: string | null;
  extracted_text: string | null;
  text_preview: string | null;
  word_count: number | null;
  byte_size: number | null;
  captured_at: IsoDatetime;
  capture_status: CaptureStatus;
  error_message: string | null;
  created_at: IsoDatetime;
  acquisition_method?: string | null;
  raw_content_type?: string | null;
  raw_byte_size?: number | null;
  extraction_method?: string | null;
  extraction_warnings?: string[] | null;
};

export type SourceListItem = Source & {
  platform_name: string;
  platform_slug: string;
  latest_snapshot_id: Uuid | null;
  latest_capture_status: CaptureStatus | null;
  latest_snapshot_title: string | null;
  latest_captured_at: IsoDatetime | null;
  latest_http_status: number | null;
  latest_content_type: string | null;
  latest_word_count: number | null;
};

export type SourceSnapshotDetail = SourceSnapshot & {
  platform_id: Uuid;
  platform_name: string;
  platform_slug: string;
  source_title: string;
  source_registry_url: string | null;
  source_status: SourceStatus;
  source_type: SourceType;
  source_priority: SourcePriority;
};

export type RedFlagCandidate = BaseRecord & {
  platform_id: Uuid;
  source_id: Uuid;
  /** Sprint 4: traceability — snapshot that generated this candidate */
  source_snapshot_id: Uuid | null;
  /** Sprint 4: traceability — primary keyword match that triggered creation */
  primary_keyword_match_id: Uuid | null;
  category: RedFlagCategory;
  headline: string;
  excerpt: string;
  matched_keywords: string[];
  confidence_note: string | null;
  reviewer_notes: string | null;
  status: RedFlagCandidateStatus;
  reviewed_at: IsoDatetime | null;
  review_status: string | null;
  review_notes: string | null;
  reviewed_by: Uuid | null;
  merged_into_candidate_id: Uuid | null;
  approved_red_flag_id: Uuid | null;
  reject_reason: string | null;
};

export type PlatformSurvivalPageStatus = "draft" | "needs_review" | "ready_for_publish" | "archived";

export type PlatformSurvivalPage = BaseRecord & {
  platform_id: Uuid;
  slug: string;
  title: string;
  summary: string | null;
  main_level: string | null;
  status: PlatformSurvivalPageStatus;
  editorial_intro: string | null;
  survival_summary: string | null;
  disclaimer_note: string | null;
  last_reviewed_at: IsoDatetime | null;
  ready_for_publish: boolean;
};

export type PlatformSurvivalPageRedFlag = {
  id: Uuid;
  page_id: Uuid;
  red_flag_id: Uuid;
  display_order: number;
  section_label: string | null;
  created_at: IsoDatetime;
  updated_at: IsoDatetime;
};

export type ResolutionRoute = BaseRecord & {
  platform_id: Uuid;
  organization_name: string;
  organization_type: string;
  country: string | null;
  jurisdiction: string | null;
  official_url: string;
  eligible_users: string[];
  eligible_disputes: string[];
  requirements: string[];
  steps: string[];
  fees: string | null;
  limits: string | null;
  deadline: string | null;
  verification_source: string | null;
  last_verified_at: IsoDatetime | null;
  status: IntelligenceStatus;
  published_at: IsoDatetime | null;
  display_order: number;
};

export type DependencyScore = BaseRecord & {
  platform_id: Uuid;
  score: number;
  risk_level: RedFlagLevel;
  factors: string[];
  explanation: string;
  generated_at: IsoDatetime;
  status: IntelligenceStatus;
  published_at: IsoDatetime | null;
};

export type RiskTimelineEvent = {
  label: string;
  detail: string;
};

export type RiskTimeline = BaseRecord & {
  platform_id: Uuid;
  title: string;
  events: RiskTimelineEvent[];
  source: string;
  status: IntelligenceStatus;
  published_at: IsoDatetime | null;
  display_order: number;
};

export type EvidenceConfidence = BaseRecord & {
  platform_id: Uuid;
  score: number;
  factors: string[];
  last_verified_at: IsoDatetime | null;
  status: IntelligenceStatus;
  published_at: IsoDatetime | null;
};

export type PolicyChange = BaseRecord & {
  platform_id: Uuid;
  source_id: Uuid | null;
  old_snapshot_id: Uuid | null;
  new_snapshot_id: Uuid | null;
  change_type: string;
  summary: string | null;
  impact_level: PolicyChangeImpactLevel;
  published_status: PolicyChangeStatus;
  what_changed: string | null;
  who_is_affected: string[];
  why_it_matters: string | null;
  what_to_do: string[];
  reviewed_at: IsoDatetime | null;
  published_at: IsoDatetime | null;
  policy_source_id: Uuid | null;
  old_version_id: Uuid | null;
  new_version_id: Uuid | null;
  old_hash: string | null;
  new_hash: string | null;
  detected_at: IsoDatetime;
  status: string;
  importance: string | null;
  reviewed_by: Uuid | null;
};

export type UserPlatformWatchlist = {
  id: Uuid;
  user_id: Uuid;
  platform_id: Uuid;
  created_at: IsoDatetime;
  updated_at: IsoDatetime;
};

export type PolicyAlert = {
  id: Uuid;
  user_id: Uuid;
  policy_change_id: Uuid;
  status: PolicyAlertStatus;
  created_at: IsoDatetime;
  updated_at: IsoDatetime;
  read_at: IsoDatetime | null;
};

export type EditorialDraftBackupOption = {
  label: string;
  tradeoff: string;
};

export type EditorialDraft = BaseRecord & {
  platform_id: Uuid;
  red_flag_id: Uuid | null;
  research_packet_id: Uuid;
  draft_type: EditorialDraftType;
  title: string;
  summary: string;
  who_is_affected: string[];
  why_it_matters: string;
  survival_actions: string[];
  checklist_items: string[];
  backup_options: EditorialDraftBackupOption[];
  evidence_summary: string;
  evidence_reference_ids: Uuid[];
  ai_confidence: number;
  status: EditorialDraftStatus;
  reviewed_at: IsoDatetime | null;
  published_at: IsoDatetime | null;
  // Sprint 10.5 — Editorial Intelligence Calibration (additive JSONB fields)
  template_key: string | null;
  generation_context: Record<string, unknown> | null;
  critic_result: Record<string, unknown> | null;
  quality_evaluation: Record<string, unknown> | null;
};

export type CandidateReviewHistory = {
  id: Uuid;
  candidate_id: Uuid;
  action: string;
  old_status: string | null;
  new_status: string | null;
  reviewer: Uuid | null;
  note: string | null;
  created_at: IsoDatetime;
};

export type KeywordMatchStatus = "pending" | "grouped" | "ignored" | "promoted";

export type KeywordMatch = {
  id: Uuid;
  source_snapshot_id: Uuid;
  source_id: Uuid;
  platform_id: Uuid;
  category: string;
  keyword: string;
  matched_text: string;
  excerpt: string;
  context_before: string | null;
  context_after: string | null;
  start_offset: number | null;
  end_offset: number | null;
  confidence: number;
  noise_score: number;
  status: KeywordMatchStatus;
  candidate_id: Uuid | null;
  created_at: IsoDatetime;
  updated_at: IsoDatetime;
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
  excerpt: string | null;
  source_id: Uuid | null;
  source_snapshot_id: Uuid | null;
  keywords: string[];
  primary_evidence_reference: string | null;
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
  title?: string | null;
  source_snapshot_id?: Uuid | null;
  keyword_match_id?: Uuid | null;
  quoted_text?: string | null;
  reviewer?: Uuid | null;
  confidence?: string | null;
  display_order?: number;
  internal_notes?: string | null;
};

export type SurvivalNote = BaseRecord & {
  red_flag_id: Uuid;
  note_title: string;
  note_body: string;
  priority: NotePriority;
  status: SurvivalNoteStatus;
  published_at: IsoDatetime | null;
  title?: string | null;
  body?: string | null;
  display_order?: number;
};

export type BackupOption = BaseRecord & {
  platform_id: Uuid | null;
  label: string;
  option_type: BackupOptionType;
  summary: string;
  tradeoffs: string;
  link_url: string | null;
  status: BackupOptionStatus;
  published_at: IsoDatetime | null;
  red_flag_id?: Uuid | null;
  name?: string | null;
  description?: string | null;
  difficulty?: string | null;
  cost_level?: string | null;
};

export type Checklist = BaseRecord & {
  platform_id: Uuid | null;
  title: string;
  intro: string | null;
  status: ChecklistStatus;
  published_at: IsoDatetime | null;
  red_flag_id?: Uuid | null;
};

export type ChecklistItem = BaseRecord & {
  checklist_id: Uuid;
  label: string;
  details: string | null;
  sort_order: number;
  status: ChecklistItemStatus;
  published_at: IsoDatetime | null;
  text?: string | null;
  required?: boolean;
  display_order?: number;
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
export type CreateSourceSnapshotDto = Omit<SourceSnapshot, "id" | "created_at">;
export type CaptureFetchSourceDto = {
  source_id: Uuid;
  url: string;
  title?: string | null;
};
export type CapturePasteSourceDto = {
  source_id: Uuid;
  pasted_text: string;
  title?: string | null;
  original_url?: string | null;
};

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
  checklist_id: Uuid;
  text?: string | null;
  required?: boolean;
  status?: ChecklistItemStatus;
};
export type UpdateChecklistItemDto = Partial<CreateChecklistItemDto>;
export type PublishChecklistItemDto = {
  status: "published";
  published_at?: IsoDatetime | null;
};

export type CreatePlatformSurvivalPageDto = Omit<PlatformSurvivalPage, "id" | "created_at" | "updated_at" | "archived_at">;
export type CreatePlatformSurvivalPageRedFlagDto = Omit<PlatformSurvivalPageRedFlag, "id" | "created_at" | "updated_at">;
export type CreateResolutionRouteDto = Omit<ResolutionRoute, "id" | "created_at" | "updated_at" | "archived_at" | "published_at"> & {
  published_at?: IsoDatetime | null;
};
export type UpdateResolutionRouteDto = Partial<CreateResolutionRouteDto>;
export type CreateDependencyScoreDto = Omit<DependencyScore, "id" | "created_at" | "updated_at" | "archived_at" | "published_at"> & {
  published_at?: IsoDatetime | null;
};
export type UpdateDependencyScoreDto = Partial<CreateDependencyScoreDto>;
export type CreateRiskTimelineDto = Omit<RiskTimeline, "id" | "created_at" | "updated_at" | "archived_at" | "published_at"> & {
  published_at?: IsoDatetime | null;
};
export type UpdateRiskTimelineDto = Partial<CreateRiskTimelineDto>;
export type CreateEvidenceConfidenceDto = Omit<EvidenceConfidence, "id" | "created_at" | "updated_at" | "archived_at" | "published_at"> & {
  published_at?: IsoDatetime | null;
};
export type UpdateEvidenceConfidenceDto = Partial<CreateEvidenceConfidenceDto>;
export type CreatePolicyChangeDto = Omit<PolicyChange, "id" | "created_at" | "updated_at" | "archived_at" | "published_at"> & {
  published_at?: IsoDatetime | null;
};
export type UpdatePolicyChangeDto = Partial<CreatePolicyChangeDto>;
export type CreateUserPlatformWatchlistDto = Omit<
  UserPlatformWatchlist,
  "id" | "created_at" | "updated_at"
>;
export type UpdateUserPlatformWatchlistDto = Partial<CreateUserPlatformWatchlistDto>;
export type CreatePolicyAlertDto = Omit<
  PolicyAlert,
  "id" | "created_at" | "updated_at"
>;
export type UpdatePolicyAlertDto = Partial<CreatePolicyAlertDto>;
export type CreateEditorialDraftDto = Omit<
  EditorialDraft,
  // Base record fields
  | "id" | "created_at" | "updated_at" | "archived_at"
  // Sprint 10.5 JSONB fields — optional on creation, populated after
  | "template_key" | "generation_context" | "critic_result" | "quality_evaluation"
> & {
  // Sprint 10.5 calibration fields are optional at creation time
  template_key?: string | null;
  generation_context?: Record<string, unknown> | null;
  critic_result?: Record<string, unknown> | null;
  quality_evaluation?: Record<string, unknown> | null;
};
export type UpdateEditorialDraftDto = Partial<CreateEditorialDraftDto>;

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
> & {
  search?: string;
};
export type SourceSnapshotListFilters = Partial<
  Pick<SourceSnapshot, "id" | "source_id" | "capture_method" | "capture_status">
>;
export type RedFlagCandidateListFilters = Partial<
  Pick<RedFlagCandidate, "id" | "platform_id" | "source_id" | "source_snapshot_id" | "status" | "category">
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
export type ResolutionRouteListFilters = Partial<
  Pick<ResolutionRoute, "id" | "platform_id" | "status">
>;
export type DependencyScoreListFilters = Partial<
  Pick<DependencyScore, "id" | "platform_id" | "status" | "risk_level">
>;
export type RiskTimelineListFilters = Partial<
  Pick<RiskTimeline, "id" | "platform_id" | "status">
>;
export type EvidenceConfidenceListFilters = Partial<
  Pick<EvidenceConfidence, "id" | "platform_id" | "status">
>;
export type PolicyChangeListFilters = Partial<
  Pick<PolicyChange, "id" | "platform_id" | "source_id" | "published_status" | "impact_level">
>;
export type UserPlatformWatchlistListFilters = Partial<
  Pick<UserPlatformWatchlist, "id" | "user_id" | "platform_id">
>;
export type PolicyAlertListFilters = Partial<
  Pick<PolicyAlert, "id" | "user_id" | "policy_change_id" | "status">
>;
export type EditorialDraftListFilters = Partial<
  Pick<
    EditorialDraft,
    "id" | "platform_id" | "red_flag_id" | "research_packet_id" | "draft_type" | "status"
  >
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
export type CreateKeywordMatchDto = Omit<KeywordMatch, "id" | "created_at" | "updated_at">;
export type UpdateKeywordMatchDto = Partial<CreateKeywordMatchDto>;
export type KeywordMatchListFilters = Partial<Pick<KeywordMatch, "id" | "source_snapshot_id" | "source_id" | "platform_id" | "category" | "keyword" | "status">>;

// ─── Research Packets ────────────────────────────────────────────────────────

export type ResearchPacket = {
  id: Uuid;
  candidate_id: Uuid;
  platform_id: Uuid;
  source_snapshot_id: Uuid | null;
  category: string;
  title: string;
  status: ResearchPacketStatus;
  confidence_score: number;
  noise_score: number;
  summary: string | null;
  suggested_level: string | null;
  suggested_risk: string | null;
  scanner_observations: string | null;
  possible_false_positives: string | null;
  keywords_found: string[];
  source_url: string | null;
  generated_at: IsoDatetime;
  created_at: IsoDatetime;
  updated_at: IsoDatetime;
};

export type ResearchPacketEvidence = {
  id: Uuid;
  research_packet_id: Uuid;
  keyword_match_id: Uuid | null;
  excerpt: string;
  context_before: string | null;
  context_after: string | null;
  source_url: string | null;
  section_hint: string | null;
  confidence_score: number;
  noise_score: number;
  display_order: number;
  created_at: IsoDatetime;
};

export type ResearchPacketWithEvidence = ResearchPacket & {
  evidence: ResearchPacketEvidence[];
  platform_name?: string;
  platform_slug?: string;
  candidate_headline?: string;
  candidate_status?: string;
};

export type CreateResearchPacketDto = Omit<ResearchPacket, "id" | "created_at" | "updated_at">;
export type UpdateResearchPacketDto = Partial<Pick<ResearchPacket, "status" | "summary" | "suggested_level" | "suggested_risk" | "scanner_observations" | "possible_false_positives">>;

export type CreateResearchPacketEvidenceDto = Omit<ResearchPacketEvidence, "id" | "created_at">;

export type ResearchPacketListFilters = Partial<Pick<ResearchPacket, "id" | "candidate_id" | "platform_id" | "category" | "status">>;

/** Extended result from scanSourceSnapshotForKeywords after packet generation */
export type ScanSnapshotWithPacketsResult = ScanSnapshotResult & {
  packetsGenerated: number;
};

/** Return shape from scanSourceSnapshotForKeywords */
export type ScanSnapshotResult = {
  sourceSnapshotId: Uuid;
  sourceId: Uuid;
  platformId: Uuid;
  totalMatchesFound: number;
  matchesInserted: number;
  duplicatesSkipped: number;
  candidatesCreated: number;
  categoriesFound: string[];
  warnings: string[];
};
