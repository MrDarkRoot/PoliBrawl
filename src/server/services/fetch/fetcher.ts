import "server-only";

import { createFetchLog } from "@/server/repositories/source-repository";

export async function fetchPolicySource(source: { id: string; url: string }) {
  try {
    const response = await fetch(source.url, {
      headers: {
        "User-Agent": "EditorialPlatformBot/1.0",
      },
      redirect: "follow",
    });

    const body = await response.text();

    const log = await createFetchLog({
      policy_source_id: source.id,
      requested_url: source.url,
      final_url: response.url,
      http_status: response.status,
      content_type: response.headers.get("content-type"),
      response_size: body.length,
      success: response.ok,
      error_message: response.ok ? null : `HTTP ${response.status}`,
      metadata: {
        raw_html: body,
      },
    });

    return {
      log,
      body,
      finalUrl: response.url,
      ok: response.ok,
    };
  } catch (error) {
    const log = await createFetchLog({
      policy_source_id: source.id,
      requested_url: source.url,
      success: false,
      error_message: error instanceof Error ? error.message : "Unknown fetch error",
      metadata: {},
    });

    return {
      log,
      body: "",
      finalUrl: null,
      ok: false,
    };
  }
}
