import "server-only";

import { createHash } from "node:crypto";
import { queryOne } from "@/server/polibrawl/db";
import { findSourceById, updateSource } from "@/server/polibrawl/repositories/source.repository";
import { createSourceSnapshot } from "@/server/polibrawl/repositories/source-snapshot.repository";
import type { CreateSourceSnapshotDto, Uuid } from "@/types/polibrawl";

import type { AcquireSourceInput, AcquisitionResult, AcquisitionAttempt, AcquisitionMethod, AdapterResult } from "./types";
import { captureByHttp } from "./http-acquisition.adapter";
import { captureByBrowser } from "./browser-acquisition.adapter";
import { captureByPaste } from "./paste-acquisition.adapter";
import { captureByUpload } from "./upload-acquisition.adapter";

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

async function recordAttempt(sourceId: string, attempt: AcquisitionAttempt) {
  await queryOne(
    `insert into source_acquisition_attempts (
      source_id, method, status, http_status, final_url, error_code, error_message, duration_ms
    ) values ($1, $2, $3, $4, $5, $6, $7, $8) returning id`,
    [
      sourceId,
      attempt.method,
      attempt.status,
      attempt.httpStatus,
      attempt.finalUrl,
      attempt.errorCode,
      attempt.errorMessage,
      attempt.durationMs,
    ]
  );
}

export async function acquireSourceSnapshot(input: AcquireSourceInput): Promise<AcquisitionResult> {
  const source = await findSourceById(input.sourceId);
  if (!source) {
    throw new Error("Source not found");
  }

  const requestedMethod = input.method || "auto";
  const url = input.url || source.url;

  if (!url && ["http", "browser", "auto"].includes(requestedMethod)) {
    throw new Error("URL is required for HTTP/Browser acquisition.");
  }

  const fallbackTitle = source.title;
  const attempts: AcquisitionAttempt[] = [];
  
  const methodsToTry: Exclude<AcquisitionMethod, "auto">[] = [];
  if (requestedMethod === "auto") {
    methodsToTry.push("http");
    methodsToTry.push("browser");
  } else {
    methodsToTry.push(requestedMethod as Exclude<AcquisitionMethod, "auto">);
  }

  let finalAdapterResult: AdapterResult | null = null;
  let successfulMethod: Exclude<AcquisitionMethod, "auto"> | null = null;

  for (const method of methodsToTry) {
    const startTime = Date.now();
    let result: AdapterResult;

    if (method === "http") {
      result = await captureByHttp(url!, fallbackTitle);
    } else if (method === "browser") {
      result = await captureByBrowser(url!, fallbackTitle);
    } else if (method === "paste") {
      if (!input.pastedText) throw new Error("Pasted text is required for paste acquisition");
      result = await captureByPaste(input.pastedText, url || null, fallbackTitle);
    } else if (method === "upload_html" || method === "upload_text") {
      if (!input.uploadedContent) throw new Error("Uploaded content is required for upload acquisition");
      result = await captureByUpload(input.uploadedContent, method, input.uploadedFilename || "upload", url || null, fallbackTitle);
    } else {
      throw new Error(`Unsupported method: ${method}`);
    }

    const durationMs = Date.now() - startTime;
    
    attempts.push({
      method,
      status: result.status,
      httpStatus: result.httpStatus,
      finalUrl: result.finalUrl,
      errorCode: result.status === "succeeded" ? null : result.errorCode,
      errorMessage: result.status === "succeeded" ? null : result.errorMessage,
      durationMs,
      warnings: result.warnings,
    });

    await recordAttempt(source.id, attempts[attempts.length - 1]);

    if (result.status === "succeeded") {
      finalAdapterResult = result;
      successfulMethod = method;
      break;
    }
  }

  const lastAttempt = attempts[attempts.length - 1];

  if (!finalAdapterResult || finalAdapterResult.status !== "succeeded") {
    await updateSource(source.id, {
      status: "failed_capture",
      last_checked_at: new Date().toISOString(),
      last_acquisition_status: "needs_manual_capture",
      last_acquisition_error: lastAttempt?.errorMessage || "All acquisition methods failed.",
    });

    return {
      sourceId: source.id,
      snapshotId: null,
      methodUsed: null,
      attempts,
      status: "needs_manual_capture",
      extractedTextLength: null,
      wordCount: null,
      warnings: lastAttempt?.warnings || [],
      error: lastAttempt?.errorMessage || "All acquisition methods failed.",
    };
  }

  const metadata = buildSnapshotMetadata(finalAdapterResult.extractedText);
  const capturedAt = new Date().toISOString();

  const snapshotInput: CreateSourceSnapshotDto & { acquisition_method: string; extraction_warnings: string[]; raw_content_type: string | null; raw_byte_size: number | null } = {
    source_id: source.id,
    capture_method: successfulMethod === "paste" ? "paste" : "fetch", // Fallback for old enum
    acquisition_method: successfulMethod!,
    original_url: url || null,
    final_url: finalAdapterResult.finalUrl,
    http_status: finalAdapterResult.httpStatus,
    content_type: finalAdapterResult.contentType,
    content_hash: metadata.contentHash,
    title: finalAdapterResult.title,
    extracted_text: finalAdapterResult.extractedText,
    text_preview: metadata.textPreview,
    word_count: metadata.wordCount,
    byte_size: metadata.byteSize,
    captured_at: capturedAt,
    capture_status: "succeeded",
    error_message: null,
    extraction_warnings: finalAdapterResult.warnings,
    raw_content_type: finalAdapterResult.contentType,
    raw_byte_size: finalAdapterResult.byteSize,
  };

  const snapshot = await createSourceSnapshot(snapshotInput as unknown as CreateSourceSnapshotDto);

  await updateSource(source.id, {
    body_text: finalAdapterResult.extractedText,
    captured_at: capturedAt,
    last_checked_at: capturedAt,
    status: "active",
    last_acquisition_status: "succeeded",
    last_acquisition_error: null,
  });

  return {
    sourceId: source.id,
    snapshotId: snapshot.id,
    methodUsed: successfulMethod,
    attempts,
    status: "succeeded",
    extractedTextLength: finalAdapterResult.extractedText.length,
    wordCount: metadata.wordCount,
    warnings: finalAdapterResult.warnings,
    error: null,
  };
}
