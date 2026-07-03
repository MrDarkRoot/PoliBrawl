import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth";
import {
  getSourceCandidateById,
  saveCandidateContentPreview,
} from "@/server/repositories/discovery-repository";
import { extractAndClassifyDocument } from "@/server/services/classification/extract-and-classify";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminAccess();
  if (auth.kind === "missing-env") {
    return NextResponse.json({ error: "Supabase environment is not configured." }, { status: 500 });
  }

  const { id } = await params;
  const candidate = await getSourceCandidateById(id).catch(() => null);
  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
  }

  const response = await fetch(candidate.url, {
    headers: {
      "User-Agent": "EditorialPlatformBot/1.0",
    },
    redirect: "follow",
  });

  const html = await response.text();
  const extracted = extractAndClassifyDocument({
    html,
    url: response.url || candidate.url,
    title: candidate.title,
  });

  await saveCandidateContentPreview(candidate.id, {
    content_document_type: extracted.classification.documentType,
    content_source_tier: extracted.classification.sourceTier,
    content_use_for_scoring: extracted.classification.useForScoring,
    content_monitor_enabled: extracted.classification.monitorEnabled,
    content_confidence: extracted.classification.confidence,
    content_classification_reasons:
      extracted.classification.classificationReasons,
    content_preview_markdown: extracted.markdownText,
    content_preview_plain_text: extracted.plainText,
    content_preview_final_url: response.url || candidate.url,
    content_preview_fetched_at: new Date().toISOString(),
  });

  return NextResponse.redirect(new URL(`/admin/sources/candidates/${candidate.id}`, request.url));
}
