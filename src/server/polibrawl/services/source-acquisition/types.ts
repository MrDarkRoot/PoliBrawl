import "server-only";

// ─── Acquisition Methods ─────────────────────────────────────────────────────

export const acquisitionMethods = [
  "auto",
  "http",
  "browser",
  "paste",
  "upload_html",
  "upload_text",
] as const;

export type AcquisitionMethod = (typeof acquisitionMethods)[number];

// Methods that actually produce a snapshot (not the orchestration "auto" mode)
export const snapshotAcquisitionMethods = [
  "http",
  "browser",
  "paste",
  "upload_html",
  "upload_text",
] as const;

export type SnapshotAcquisitionMethod = (typeof snapshotAcquisitionMethods)[number];

// ─── Acquisition Statuses ────────────────────────────────────────────────────

export const acquisitionStatuses = [
  "succeeded",
  "failed",
  "blocked",
  "unsupported",
  "skipped",
] as const;

export type AcquisitionStatus = (typeof acquisitionStatuses)[number];

// ─── Per-Attempt Result ──────────────────────────────────────────────────────

export type AcquisitionAttempt = {
  method: Exclude<AcquisitionMethod, "auto">;
  status: AcquisitionStatus;
  httpStatus: number | null;
  finalUrl: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  durationMs: number | null;
  warnings: string[];
};

// ─── Adapter Contracts ───────────────────────────────────────────────────────

export type AdapterSuccessResult = {
  status: "succeeded";
  finalUrl: string | null;
  httpStatus: number | null;
  contentType: string | null;
  rawHtml: string | null;
  extractedText: string;
  title: string | null;
  byteSize: number;
  warnings: string[];
};

export type AdapterFailResult = {
  status: Exclude<AcquisitionStatus, "succeeded">;
  finalUrl: string | null;
  httpStatus: number | null;
  errorCode: string;
  errorMessage: string;
  warnings: string[];
};

export type AdapterResult = AdapterSuccessResult | AdapterFailResult;

// ─── Service Input ───────────────────────────────────────────────────────────

export type AcquireSourceInput = {
  sourceId: string;
  method?: AcquisitionMethod;
  url?: string;
  pastedText?: string;
  uploadedContent?: string;
  uploadedFilename?: string;
};

// ─── Service Result ──────────────────────────────────────────────────────────

export type AcquisitionResult = {
  sourceId: string;
  snapshotId: string | null;
  methodUsed: Exclude<AcquisitionMethod, "auto"> | null;
  attempts: AcquisitionAttempt[];
  status: AcquisitionStatus | "needs_manual_capture";
  extractedTextLength: number | null;
  wordCount: number | null;
  warnings: string[];
  error: string | null;
};
