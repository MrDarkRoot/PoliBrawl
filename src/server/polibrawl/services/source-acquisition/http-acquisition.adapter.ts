import "server-only";

import { fetchSourceText, SourceFetchError } from "@/server/polibrawl/services/source-fetcher.service";
import { extractTextFromContent, TextExtractionError } from "@/server/polibrawl/services/text-extraction.service";
import { detectBotChallenge } from "./source-acquisition-security";
import type { AdapterResult } from "./types";

export async function captureByHttp(url: string, fallbackTitle: string): Promise<AdapterResult> {
  const warnings: string[] = [];

  try {
    const fetched = await fetchSourceText(url);

    try {
      const extracted = extractTextFromContent({
        contentType: fetched.contentType,
        rawText: fetched.bodyText,
      });

      if (detectBotChallenge(extracted.extractedText) || detectBotChallenge(fetched.bodyText)) {
        return {
          status: "blocked",
          finalUrl: fetched.finalUrl,
          httpStatus: fetched.httpStatus,
          errorCode: "bot_challenge_detected",
          errorMessage: "The site presented a bot challenge or CAPTCHA.",
          warnings,
        };
      }

      return {
        status: "succeeded",
        finalUrl: fetched.finalUrl,
        httpStatus: fetched.httpStatus,
        contentType: fetched.contentType,
        rawHtml: fetched.bodyText,
        extractedText: extracted.extractedText,
        title: extracted.title ?? fallbackTitle,
        byteSize: fetched.byteSize,
        warnings,
      };
    } catch (error) {
      if (
        error instanceof TextExtractionError &&
        error.message === "Unsupported content type for source capture."
      ) {
        return {
          status: "unsupported",
          finalUrl: fetched.finalUrl,
          httpStatus: fetched.httpStatus,
          errorCode: "unsupported_content_type",
          errorMessage: error.message,
          warnings,
        };
      }

      return {
        status: "failed",
        finalUrl: fetched.finalUrl,
        httpStatus: fetched.httpStatus,
        errorCode: "empty_extracted_text",
        errorMessage: error instanceof Error ? error.message : "Failed to extract text.",
        warnings,
      };
    }
  } catch (error) {
    if (error instanceof SourceFetchError) {
      const isBlocked = error.code === "blocked_url" || error.code === "dns_lookup_failed";
      return {
        status: isBlocked ? "blocked" : "failed",
        finalUrl: error.details?.finalUrl ?? null,
        httpStatus: error.details?.httpStatus ?? null,
        errorCode: error.code,
        errorMessage: error.message,
        warnings,
      };
    }

    return {
      status: "failed",
      finalUrl: null,
      httpStatus: null,
      errorCode: "unknown_fetch_error",
      errorMessage: "An unexpected error occurred while fetching.",
      warnings,
    };
  }
}
