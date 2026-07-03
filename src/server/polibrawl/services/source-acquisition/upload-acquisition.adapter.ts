import "server-only";

import { extractTextFromContent, TextExtractionError } from "@/server/polibrawl/services/text-extraction.service";
import type { AdapterResult } from "./types";

export async function captureByUpload(
  uploadedContent: string,
  method: "upload_html" | "upload_text",
  filename: string,
  url: string | null,
  fallbackTitle: string
): Promise<AdapterResult> {
  const warnings: string[] = [];

  try {
    const extracted = extractTextFromContent({
      contentType: method === "upload_html" ? "text/html" : "text/plain",
      rawText: uploadedContent,
    });

    const byteSize = Buffer.byteLength(extracted.extractedText, "utf8");

    return {
      status: "succeeded",
      finalUrl: url,
      httpStatus: null,
      contentType: method === "upload_html" ? "text/html" : "text/plain",
      rawHtml: method === "upload_html" ? uploadedContent : null,
      extractedText: extracted.extractedText,
      title: extracted.title ?? fallbackTitle,
      byteSize,
      warnings,
    };
  } catch (error) {
    if (
      error instanceof TextExtractionError &&
      error.message === "Unsupported content type for source capture."
    ) {
      return {
        status: "unsupported",
        finalUrl: url,
        httpStatus: null,
        errorCode: "unsupported_content_type",
        errorMessage: error.message,
        warnings,
      };
    }

    return {
      status: "failed",
      finalUrl: url,
      httpStatus: null,
      errorCode: "empty_extracted_text",
      errorMessage: error instanceof Error ? error.message : "Failed to extract text from upload.",
      warnings,
    };
  }
}
