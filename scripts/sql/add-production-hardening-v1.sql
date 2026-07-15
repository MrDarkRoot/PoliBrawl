create unique index if not exists idx_dependency_scores_one_published_per_platform
  on dependency_scores (platform_id)
  where status = 'published' and archived_at is null;

create unique index if not exists idx_evidence_confidence_one_published_per_platform
  on evidence_confidence (platform_id)
  where status = 'published' and archived_at is null;
