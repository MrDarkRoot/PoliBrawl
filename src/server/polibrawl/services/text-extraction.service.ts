import "server-only";

import { load } from "cheerio";

export class TextExtractionError extends Error {}

export function normalizeWhitespace(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function isHtmlContentType(contentType: string) {
  return (
    contentType.includes("text/html") ||
    contentType.includes("application/xhtml+xml")
  );
}

function isPlainTextContentType(contentType: string) {
  return (
    contentType.includes("text/plain") ||
    contentType.includes("text/markdown") ||
    contentType.includes("application/json")
  );
}

export function extractTextFromContent(input: {
  contentType: string | null;
  rawText: string;
}) {
  const contentType = input.contentType?.toLowerCase() ?? "";

  if (isHtmlContentType(contentType)) {
    const $ = load(input.rawText);
    const title = normalizeWhitespace($("title").first().text()) || null;

    $(
      "script, style, noscript, svg, nav, footer, header, aside, form, button, iframe",
    ).remove();

    const root = $("main").first().length ? $("main").first() : $("body");
    const extractedText = normalizeWhitespace(root.text());

    if (!extractedText) {
      throw new TextExtractionError("No readable text was extracted from the page.");
    }

    return {
      title,
      extractedText,
    };
  }

  if (isPlainTextContentType(contentType)) {
    const extractedText = normalizeWhitespace(input.rawText);

    if (!extractedText) {
      throw new TextExtractionError("No readable text was extracted from the content.");
    }

    return {
      title: null,
      extractedText,
    };
  }

  throw new TextExtractionError("Unsupported content type for source capture.");
}
