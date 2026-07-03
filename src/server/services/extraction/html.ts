import "server-only";

import * as cheerio from "cheerio";

export function extractPolicyText(html: string) {
  const $ = cheerio.load(html);

  $("script, style, noscript, iframe, template, svg").remove();
  $("header, footer, nav, aside").remove();

  const mainNode =
    $("main").first() ||
    $("[role='main']").first() ||
    $("article").first() ||
    $("body").first();

  const mainHtml = (mainNode.html() ?? "").trim();
  const mainText = mainNode.text().trim();
  const fallbackText = $("body").text().trim();

  const normalized = (mainText || fallbackText)
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s{3,}/g, "\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return {
    plainText: normalized,
    mainHtml: mainHtml || html,
    extractionConfidence: normalized.length > 1000 ? 0.86 : 0.62,
  };
}
