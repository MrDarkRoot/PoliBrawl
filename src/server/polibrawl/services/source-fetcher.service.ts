import "server-only";

import dns from "node:dns/promises";
import net from "node:net";

const MAX_REDIRECTS = 3;
const MAX_RESPONSE_BYTES = 1_500_000;
const REQUEST_TIMEOUT_MS = 10_000;
const USER_AGENT = "PoliBrawl Admin Source Capture/1.0";

export class SourceFetchError extends Error {
  constructor(
    message: string,
    readonly code:
      | "invalid_url"
      | "blocked_url"
      | "dns_lookup_failed"
      | "redirect_limit"
      | "fetch_timeout"
      | "fetch_failed"
      | "response_too_large"
      | "http_error",
    readonly details: {
      finalUrl?: string | null;
      httpStatus?: number | null;
      contentType?: string | null;
    } = {},
  ) {
    super(message);
  }
}

type SafeFetchResult = {
  originalUrl: string;
  finalUrl: string;
  httpStatus: number;
  contentType: string | null;
  bodyText: string;
  byteSize: number;
};

function parseIpv4(input: string) {
  const parts = input.split(".");
  if (parts.length !== 4) {
    return null;
  }

  const octets = parts.map((part) => Number(part));

  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return null;
  }

  return octets;
}

function isBlockedIpv4(input: string) {
  const octets = parseIpv4(input);
  if (!octets) {
    return false;
  }

  const [a, b] = octets;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19))
  );
}

function isBlockedIpv6(input: string) {
  const normalized = input.toLowerCase();

  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb") ||
    normalized === "::ffff:127.0.0.1" ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.") ||
    /^::ffff:172\.(1[6-9]|2\d|3[0-1])\./.test(normalized) ||
    normalized.startsWith("::ffff:169.254.")
  );
}

function isBlockedIpAddress(input: string) {
  const ipVersion = net.isIP(input);

  if (ipVersion === 4) {
    return isBlockedIpv4(input);
  }

  if (ipVersion === 6) {
    return isBlockedIpv6(input);
  }

  return false;
}

async function assertSafeHostname(hostname: string) {
  const normalized = hostname.toLowerCase();

  if (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized === "metadata.google.internal"
  ) {
    throw new SourceFetchError(
      "That URL points to a blocked internal host.",
      "blocked_url",
    );
  }

  if (net.isIP(normalized)) {
    if (isBlockedIpAddress(normalized)) {
      throw new SourceFetchError(
        "That URL points to a blocked internal address.",
        "blocked_url",
      );
    }

    return;
  }

  let results: Array<{ address: string; family: number }>;

  try {
    results = await dns.lookup(normalized, { all: true, verbatim: true });
  } catch {
    throw new SourceFetchError(
      "DNS lookup failed for that URL.",
      "dns_lookup_failed",
    );
  }

  if (!results.length) {
    throw new SourceFetchError(
      "DNS lookup failed for that URL.",
      "dns_lookup_failed",
    );
  }

  for (const result of results) {
    if (isBlockedIpAddress(result.address)) {
      throw new SourceFetchError(
        "That URL resolves to a blocked internal address.",
        "blocked_url",
      );
    }
  }
}

async function assertSafePublicUrl(rawUrl: string) {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new SourceFetchError("Enter a valid URL.", "invalid_url");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new SourceFetchError(
      "Only http and https URLs are allowed.",
      "blocked_url",
    );
  }

  await assertSafeHostname(parsed.hostname);
  return parsed;
}

async function readBodyWithLimit(response: Response) {
  const reader = response.body?.getReader();

  if (!reader) {
    return {
      bodyText: "",
      byteSize: 0,
    };
  }

  const chunks: Uint8Array[] = [];
  let byteSize = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    byteSize += value.byteLength;

    if (byteSize > MAX_RESPONSE_BYTES) {
      throw new SourceFetchError(
        "The fetched response was too large for MVP capture.",
        "response_too_large",
      );
    }

    chunks.push(value);
  }

  const merged = new Uint8Array(byteSize);
  let offset = 0;

  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return {
    bodyText: new TextDecoder().decode(merged),
    byteSize,
  };
}

function isRedirect(response: Response) {
  return response.status >= 300 && response.status < 400;
}

export async function fetchSourceText(rawUrl: string): Promise<SafeFetchResult> {
  const originalUrl = (await assertSafePublicUrl(rawUrl)).toString();
  let currentUrl = originalUrl;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const response = await fetch(currentUrl, {
      method: "GET",
      redirect: "manual",
      headers: {
        Accept: "text/html,text/plain;q=0.9,*/*;q=0.1",
        "User-Agent": USER_AGENT,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    }).catch((error: unknown) => {
      if (
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        (error.name === "TimeoutError" || error.name === "AbortError")
      ) {
        throw new SourceFetchError(
          "The source fetch timed out.",
          "fetch_timeout",
        );
      }

      throw new SourceFetchError(
        "The source could not be fetched.",
        "fetch_failed",
      );
    });

    if (isRedirect(response)) {
      const location = response.headers.get("location");

      if (!location) {
        throw new SourceFetchError(
          "The source redirected without a destination URL.",
          "fetch_failed",
          {
            finalUrl: currentUrl,
            httpStatus: response.status,
          },
        );
      }

      if (redirectCount === MAX_REDIRECTS) {
        throw new SourceFetchError(
          "The source redirected too many times.",
          "redirect_limit",
          {
            finalUrl: currentUrl,
            httpStatus: response.status,
          },
        );
      }

      currentUrl = new URL(location, currentUrl).toString();
      await assertSafePublicUrl(currentUrl);
      continue;
    }

    const contentType = response.headers.get("content-type");
    const { bodyText, byteSize } = await readBodyWithLimit(response);

    if (!response.ok) {
      throw new SourceFetchError(
        `The source returned HTTP ${response.status}.`,
        "http_error",
        {
          finalUrl: currentUrl,
          httpStatus: response.status,
          contentType,
        },
      );
    }

    return {
      originalUrl,
      finalUrl: currentUrl,
      httpStatus: response.status,
      contentType,
      bodyText,
      byteSize,
    };
  }

  throw new SourceFetchError(
    "The source redirected too many times.",
    "redirect_limit",
  );
}
