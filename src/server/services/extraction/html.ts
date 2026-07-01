import "server-only";

import * as cheerio from "cheerio";

export function extractPolicyText(html: string) {
  const $ = cheerio.load(html);

  $("script, style, noscript, iframe").remove();
  $("header nav, footer nav, aside").remove();

  const mainCandidate =
    $("main").first().text().trim() ||
    $("[role='main']").first().text().trim() ||
    $("article").first().text().trim() ||
    $("body").text().trim();

  const normalized = mainCandidate
    .replace(/\u00a0/g, " ")
    .replace(/\s{3,}/g, "\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return {
    plainText: normalized,
    extractionConfidence: normalized.length > 1000 ? 0.86 : 0.62,
  };
}
