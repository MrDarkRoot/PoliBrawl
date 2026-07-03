import "server-only";

import { assertSafePublicUrl } from "@/server/polibrawl/services/source-fetcher.service";
import { normalizeWhitespace } from "@/server/polibrawl/services/text-extraction.service";
import { detectBotChallenge } from "./source-acquisition-security";
import type { AdapterResult } from "./types";

const MAX_RESPONSE_BYTES = 1_500_000;
const MAX_TEXT_LENGTH = 500_000;

interface PlaywrightResponse {
  request: () => { resourceType: () => string };
  status: () => number;
  headers: () => Record<string, string>;
}

export async function captureByBrowser(url: string, fallbackTitle: string): Promise<AdapterResult> {
  const warnings: string[] = [];

  try {
    // 1. Enforce SSRF protection before ANY navigation
    await assertSafePublicUrl(url);
  } catch (error) {
    return {
      status: "blocked",
      finalUrl: null,
      httpStatus: null,
      errorCode: "blocked_url",
      errorMessage: error instanceof Error ? error.message : "Blocked URL",
      warnings,
    };
  }

  let chromium;
  try {
    const pw = await import("playwright-core");
    chromium = pw.chromium;
  } catch {
    return {
      status: "skipped",
      finalUrl: null,
      httpStatus: null,
      errorCode: "browser_not_installed",
      errorMessage: "Browser capture is not available in this environment.",
      warnings,
    };
  }

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const context = await browser.newContext({
      userAgent: "PoliBrawl Admin Browser Capture/1.0",
      ignoreHTTPSErrors: true,
      viewport: { width: 1280, height: 800 },
    });

    const page = await context.newPage();

    let httpStatus: number | null = null;
    let contentType: string | null = null;

    page.on("response", (response: PlaywrightResponse) => {
      if (response.request().resourceType() === "document") {
        httpStatus = response.status();
        contentType = response.headers()["content-type"] || null;
      }
    });

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    } catch (error: unknown) {
      return {
        status: "failed",
        finalUrl: page.url(),
        httpStatus,
        errorCode: "navigation_failed",
        errorMessage: error instanceof Error ? error.message : "Failed to load page in browser.",
        warnings,
      };
    }

    const finalUrl = page.url();

    // Check SSRF again on final URL just in case of weird redirects
    try {
      await assertSafePublicUrl(finalUrl);
    } catch {
      return {
        status: "blocked",
        finalUrl,
        httpStatus,
        errorCode: "blocked_redirect",
        errorMessage: "The site redirected to a blocked internal address.",
        warnings,
      };
    }

    // Wait a brief moment for dynamic content
    await page.waitForTimeout(2000).catch(() => {});

    // Try to dismiss cookie banners if simple
    try {
      await page.evaluate(() => {
        document.querySelectorAll('button').forEach((b) => {
          const text = b.innerText.toLowerCase();
          if (text.includes("accept") || text.includes("agree") || text.includes("got it") || text.includes("allow")) {
            b.click();
          }
        });
      });
      await page.waitForTimeout(500).catch(() => {});
    } catch {
      // Ignore errors here
    }

    const rawHtml = await page.content().catch(() => "");
    
    // Remove noise elements before extracting text
    await page.evaluate(() => {
      const selectorsToRemove = [
        "script", "style", "noscript", "svg", "nav", "footer", "header", "aside", "form", "iframe",
      ];
      selectorsToRemove.forEach((selector) => {
        document.querySelectorAll(selector).forEach((el) => el.remove());
      });
    }).catch(() => {});

    const rawText = await page.evaluate(() => {
      const root = document.querySelector("main") || document.body;
      return root ? root.innerText : "";
    }).catch(() => "");

    const extractedText = normalizeWhitespace(rawText);
    const title = await page.title().catch(() => null) || fallbackTitle;

    if (detectBotChallenge(extractedText) || detectBotChallenge(rawHtml)) {
      return {
        status: "blocked",
        finalUrl,
        httpStatus,
        errorCode: "bot_challenge_detected",
        errorMessage: "The site presented a bot challenge or CAPTCHA.",
        warnings,
      };
    }

    if (!extractedText) {
      return {
        status: "failed",
        finalUrl,
        httpStatus,
        errorCode: "empty_extracted_text",
        errorMessage: "No readable text was extracted from the page.",
        warnings,
      };
    }

    if (extractedText.length > MAX_TEXT_LENGTH) {
      warnings.push("Extracted text was truncated because it exceeded the size limit.");
    }

    const byteSize = Buffer.byteLength(extractedText, "utf8");
    if (byteSize > MAX_RESPONSE_BYTES) {
       return {
        status: "failed",
        finalUrl,
        httpStatus,
        errorCode: "response_too_large",
        errorMessage: "The fetched response was too large.",
        warnings,
      };
    }

    return {
      status: "succeeded",
      finalUrl,
      httpStatus,
      contentType: contentType || "text/html",
      rawHtml,
      extractedText: extractedText.slice(0, MAX_TEXT_LENGTH),
      title,
      byteSize,
      warnings,
    };
  } catch (error) {
    return {
      status: "failed",
      finalUrl: null,
      httpStatus: null,
      errorCode: "browser_error",
      errorMessage: error instanceof Error ? error.message : "Unknown browser error.",
      warnings,
    };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
