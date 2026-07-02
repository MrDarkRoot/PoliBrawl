import "server-only";

import { createHash } from "node:crypto";

import {
  createSourceSnapshot,
  findSourceById,
  updateSource,
} from "@/server/polibrawl/repositories";
import {
  fetchSourceText,
  SourceFetchError,
} from "@/server/polibrawl/services/source-fetcher.service";
import {
  extractTextFromContent,
  normalizeWhitespace,
  TextExtractionError,
} from "@/server/polibrawl/services/text-extraction.service";
import type {
  CaptureFetchSourceDto,
  CapturePasteSourceDto,
  CreateSourceSnapshotDto,
} from "@/types/polibrawl";

export class SourceCaptureError extends Error {
  constructor(
    message: string,
    readonly code:
      | "source_not_found"
      | "invalid_capture"
      | "blocked_url"
      | "fetch_failed"
      | "unsupported_content_type"
      | "empty_extracted_text",
  ) {
    super(message);
  }
}

function buildSnapshotMetadata(extractedText: string) {
  const contentHash = createHash("sha256").update(extractedText).digest("hex");
  const wordCount = extractedText.split(/\s+/).filter(Boolean).length;
  const byteSize = Buffer.byteLength(extractedText, "utf8");
  const textPreview = extractedText.slice(0, 1000);

  return {
    contentHash,
    wordCount,
    byteSize,
    textPreview,
  };
}

async function recordFailedCapture(input: {
  sourceId: string;
  captureMethod: "fetch" | "paste";
  originalUrl?: string | null;
  finalUrl?: string | null;
  httpStatus?: number | null;
  contentType?: string | null;
  title?: string | null;
  errorMessage: string;
}) {
  const capturedAt = new Date().toISOString();

  await createSourceSnapshot({
    source_id: input.sourceId,
    capture_method: input.captureMethod,
    original_url: input.originalUrl ?? null,
    final_url: input.finalUrl ?? null,
    http_status: input.httpStatus ?? null,
    content_type: input.contentType ?? null,
    content_hash: null,
    title: input.title ?? null,
    extracted_text: null,
    text_preview: null,
    word_count: null,
    byte_size: null,
    captured_at: capturedAt,
    capture_status: "failed",
    error_message: input.errorMessage,
  });

  await updateSource(input.sourceId, {
    status: "failed_capture",
    last_checked_at: capturedAt,
  });
}

async function storeSuccessfulCapture(input: {
  sourceId: string;
  captureMethod: "fetch" | "paste";
  originalUrl?: string | null;
  finalUrl?: string | null;
  httpStatus?: number | null;
  contentType?: string | null;
  title?: string | null;
  extractedText: string;
  byteSize?: number | null;
}) {
  const capturedAt = new Date().toISOString();
  const metadata = buildSnapshotMetadata(input.extractedText);

  const snapshotInput: CreateSourceSnapshotDto = {
    source_id: input.sourceId,
    capture_method: input.captureMethod,
    original_url: input.originalUrl ?? null,
    final_url: input.finalUrl ?? null,
    http_status: input.httpStatus ?? null,
    content_type: input.contentType ?? null,
    content_hash: metadata.contentHash,
    title: input.title ?? null,
    extracted_text: input.extractedText,
    text_preview: metadata.textPreview,
    word_count: metadata.wordCount,
    byte_size: input.byteSize ?? metadata.byteSize,
    captured_at: capturedAt,
    capture_status: "succeeded",
    error_message: null,
  };

  const snapshot = await createSourceSnapshot(snapshotInput);

  await updateSource(input.sourceId, {
    body_text: input.extractedText,
    captured_at: capturedAt,
    last_checked_at: capturedAt,
    status: "active",
  });

  return snapshot;
}

export async function captureSourceByFetch(input: CaptureFetchSourceDto) {
  const source = await findSourceById(input.source_id);

  if (!source) {
    throw new SourceCaptureError("Source not found.", "source_not_found");
  }

  let fetched: Awaited<ReturnType<typeof fetchSourceText>>;

  try {
    fetched = await fetchSourceText(input.url);
  } catch (error) {
    const safeMessage =
      error instanceof SourceFetchError
        ? error.message
        : "The source could not be captured.";

    await recordFailedCapture({
      sourceId: source.id,
      captureMethod: "fetch",
      originalUrl: input.url,
      finalUrl:
        error instanceof SourceFetchError ? error.details.finalUrl ?? null : null,
      httpStatus:
        error instanceof SourceFetchError ? error.details.httpStatus ?? null : null,
      contentType:
        error instanceof SourceFetchError ? error.details.contentType ?? null : null,
      title: input.title ?? source.title,
      errorMessage: safeMessage,
    });

    if (error instanceof SourceFetchError && error.code === "blocked_url") {
      throw new SourceCaptureError(error.message, "blocked_url");
    }

    throw new SourceCaptureError(safeMessage, "fetch_failed");
  }

  try {
    const extracted = extractTextFromContent({
      contentType: fetched.contentType,
      rawText: fetched.bodyText,
    });

    return await storeSuccessfulCapture({
      sourceId: source.id,
      captureMethod: "fetch",
      originalUrl: fetched.originalUrl,
      finalUrl: fetched.finalUrl,
      httpStatus: fetched.httpStatus,
      contentType: fetched.contentType,
      title: input.title ?? extracted.title ?? source.title,
      extractedText: extracted.extractedText,
      byteSize: fetched.byteSize,
    });
  } catch (error) {
    const safeMessage =
      error instanceof TextExtractionError
        ? error.message
        : "The source could not be captured.";

    await recordFailedCapture({
      sourceId: source.id,
      captureMethod: "fetch",
      originalUrl: fetched.originalUrl,
      finalUrl: fetched.finalUrl,
      httpStatus: fetched.httpStatus,
      contentType: fetched.contentType,
      title: input.title ?? source.title,
      errorMessage: safeMessage,
    });

    if (
      error instanceof TextExtractionError &&
      error.message === "Unsupported content type for source capture."
    ) {
      throw new SourceCaptureError(error.message, "unsupported_content_type");
    }

    throw new SourceCaptureError(safeMessage, "empty_extracted_text");
  }
}

export async function captureSourceByPaste(input: CapturePasteSourceDto) {
  const source = await findSourceById(input.source_id);

  if (!source) {
    throw new SourceCaptureError("Source not found.", "source_not_found");
  }

  const extractedText = normalizeWhitespace(input.pasted_text);

  if (!extractedText) {
    await recordFailedCapture({
      sourceId: source.id,
      captureMethod: "paste",
      originalUrl: input.original_url ?? null,
      title: input.title ?? source.title,
      errorMessage: "Paste capture cannot be empty.",
    });

    throw new SourceCaptureError(
      "Paste capture cannot be empty.",
      "empty_extracted_text",
    );
  }

  return storeSuccessfulCapture({
    sourceId: source.id,
    captureMethod: "paste",
    originalUrl: input.original_url ?? source.url,
    finalUrl: input.original_url ?? source.url,
    title: input.title ?? source.title,
    extractedText,
  });
}
