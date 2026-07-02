import "server-only";

import { createCrudRepository } from "@/server/polibrawl/repositories/base.repository";
import type {
  CreateReviewRequestDto,
  ReviewRequest,
  ReviewRequestListFilters,
  UpdateReviewRequestDto,
} from "@/types/polibrawl";

const reviewRequestColumns = [
  "platform_id",
  "platform_name",
  "email",
  "message",
  "status",
  "reviewed_at",
  "archived_at",
] as const;

export const reviewRequestRepository = createCrudRepository<
  ReviewRequest,
  CreateReviewRequestDto,
  UpdateReviewRequestDto,
  ReviewRequestListFilters
>({
  tableName: "review_requests",
  insertableColumns: reviewRequestColumns,
  updatableColumns: reviewRequestColumns,
  filterableColumns: ["id", "platform_id", "status"],
  defaultOrderBy: "created_at desc",
  archive: {
    archivedAtColumn: "archived_at",
  },
});

export const listReviewRequests = reviewRequestRepository.list;
export const findReviewRequestById = reviewRequestRepository.findById;
export const findReviewRequest = reviewRequestRepository.findOne;
export const createReviewRequest = reviewRequestRepository.insert;
export const updateReviewRequest = reviewRequestRepository.update;
export const archiveReviewRequest = reviewRequestRepository.archive;
