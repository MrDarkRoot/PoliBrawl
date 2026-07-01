import "server-only";

import * as cheerio from "cheerio";
import { XMLParser } from "fast-xml-parser";

import { classifyCandidate } from "@/server/services/discovery/classifier";

const commonPolicyPaths = [
  "/terms",
  "/terms-of-service",
  "/privacy",
  "/privacy-policy",
  "/legal",
  "/acceptable-use-policy",
  "/fees",
  "/refund-policy",
  "/developer-terms",
  "/api-terms",
  "/dpa",
];

function normalizeUrl(url: string, origin?: string) {
  try {
    return new URL(url, origin).toString();
  } catch {
    return null;
  }
}

async function safeFetch(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "EditorialPlatformBot/1.0",
      },
      redirect: "follow",
    });

    return response;
  } catch {
    return null;
  }
}

async function discoverFromHomepage(origin: string) {
  const response = await safeFetch(origin);
  if (!response?.ok) {
    return [];
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const candidates = new Map<string, { title: string | null; detectionReason: string }>();

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    const text = $(element).text().trim();
    const absolute = href ? normalizeUrl(href, origin) : null;

    if (!absolute || !absolute.startsWith(origin)) {
      return;
    }

    const label = `${text} ${href}`.toLowerCase();
    if (!/(terms|privacy|policy|legal|refund|fees|developer|api|security|billing)/i.test(label)) {
      return;
    }

    candidates.set(absolute, {
      title: text || null,
      detectionReason: /(footer)/i.test($(element).closest("footer").text())
        ? "footer_link"
        : "header_link",
    });
  });

  return Array.from(candidates.entries()).map(([url, value]) => ({
    url,
    title: value.title,
    detectionReason: value.detectionReason,
  }));
}

async function discoverRobots(origin: string) {
  const response = await safeFetch(`${origin}/robots.txt`);
  if (!response?.ok) {
    return { sitemaps: [] as string[], candidates: [] as string[] };
  }

  const content = await response.text();
  const lines = content.split(/\r?\n/);
  const sitemaps = lines
    .filter((line) => /^sitemap:/i.test(line))
    .map((line) => line.split(":").slice(1).join(":").trim())
    .map((line) => normalizeUrl(line, origin))
    .filter((value): value is string => Boolean(value));

  const candidates = lines
    .map((line) => line.replace(/^(Disallow|Allow):/i, "").trim())
    .filter((line) => /(terms|privacy|policy|legal|refund|fees|developer|api)/i.test(line))
    .map((line) => normalizeUrl(line, origin))
    .filter((value): value is string => Boolean(value));

  return { sitemaps, candidates };
}

async function discoverFromSitemaps(origin: string, sitemapUrls: string[]) {
  const parser = new XMLParser({
    ignoreAttributes: false,
  });

  const queue = [...new Set([...sitemapUrls, `${origin}/sitemap.xml`])].slice(0, 5);
  const visited = new Set<string>();
  const results = new Set<string>();

  while (queue.length) {
    const url = queue.shift();
    if (!url || visited.has(url)) {
      continue;
    }
    visited.add(url);

    const response = await safeFetch(url);
    if (!response?.ok) {
      continue;
    }

    const text = await response.text();
    const parsed = parser.parse(text);
    const entries = parsed?.urlset?.url ?? [];
    const indexes = parsed?.sitemapindex?.sitemap ?? [];

    const urls = Array.isArray(entries) ? entries : [entries];
    urls.forEach((entry) => {
      const location = normalizeUrl(entry?.loc, origin);
      if (
        location &&
        /(terms|privacy|policy|legal|refund|fees|developer|api|billing)/i.test(
          location,
        )
      ) {
        results.add(location);
      }
    });

    const nested = Array.isArray(indexes) ? indexes : [indexes];
    nested
      .map((entry) => normalizeUrl(entry?.loc, origin))
      .filter((value): value is string => Boolean(value))
      .slice(0, 5)
      .forEach((value) => queue.push(value));
  }

  return Array.from(results);
}

async function discoverGeneratedPaths(origin: string) {
  const valid = new Set<string>();

  for (const path of commonPolicyPaths) {
    const url = normalizeUrl(path, origin);
    if (!url) {
      continue;
    }
    const response = await safeFetch(url);
    if (response?.ok) {
      valid.add(url);
    }
  }

  return Array.from(valid);
}

export async function runDiscovery(input: { websiteUrl: string }) {
  const origin = new URL(input.websiteUrl).origin;
  const homepageCandidates = await discoverFromHomepage(origin);
  const robots = await discoverRobots(origin);
  const sitemapCandidates = await discoverFromSitemaps(origin, robots.sitemaps);
  const generatedCandidates = await discoverGeneratedPaths(origin);

  const merged = new Map<
    string,
    { title?: string | null; detectionReason: string; confidenceBoost?: number }
  >();

  homepageCandidates.forEach((candidate) => {
    merged.set(candidate.url, {
      title: candidate.title,
      detectionReason: candidate.detectionReason,
      confidenceBoost: 0.05,
    });
  });

  robots.candidates.forEach((url) => {
    merged.set(url, {
      detectionReason: "robots_path",
      confidenceBoost: 0.03,
    });
  });

  sitemapCandidates.forEach((url) => {
    merged.set(url, {
      detectionReason: "sitemap_discovery",
      confidenceBoost: 0.04,
    });
  });

  generatedCandidates.forEach((url) => {
    if (!merged.has(url)) {
      merged.set(url, {
        detectionReason: "generated_path",
      });
    }
  });

  const candidates = Array.from(merged.entries()).map(([url, metadata]) => {
    const classification = classifyCandidate({
      url,
      title: metadata.title,
    });

    return {
      url,
      title: metadata.title ?? null,
      suggestedDocumentType: classification.documentType,
      suggestedTier: classification.sourceTier,
      confidence: Math.min(
        0.99,
        classification.confidence + (metadata.confidenceBoost ?? 0),
      ),
      detectionReason: metadata.detectionReason,
    };
  });

  return {
    origin,
    robotsSitemaps: robots.sitemaps,
    candidates,
  };
}
