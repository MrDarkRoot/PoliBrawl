import "server-only";

import { normalizeWhitespace } from "@/server/polibrawl/services/text-extraction.service";
import type { AdapterResult } from "./types";

export async function captureByPaste(
  pastedText: string,
  url: string | null,
  fallbackTitle: string
): Promise<AdapterResult> {
  const warnings: string[] = [];
  const extractedText = normalizeWhitespace(pastedText);

  if (!extractedText) {
    return {
      status: "failed",
      finalUrl: url,
      httpStatus: null,
      errorCode: "empty_extracted_text",
      errorMessage: "Paste capture cannot be empty.",
      warnings,
    };
  }

  const byteSize = Buffer.byteLength(extractedText, "utf8");

  return {
    status: "succeeded",
    finalUrl: url,
    httpStatus: null,
    contentType: "text/plain",
    rawHtml: null,
    extractedText,
    title: fallbackTitle,
    byteSize,
    warnings,
  };
}
