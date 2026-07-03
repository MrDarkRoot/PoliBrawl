import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth";
import {
  getLatestSuccessfulFetchLog,
  getPolicySourceById,
  updatePolicySourceContentClassification,
} from "@/server/repositories/source-repository";
import { extractAndClassifyDocument } from "@/server/services/classification/extract-and-classify";
import { processDocumentVersion } from "@/server/services/documents/processor";
import { fetchPolicySource } from "@/server/services/fetch/fetcher";
import { createVersionIfChanged } from "@/server/services/versioning/version-manager";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminAccess();
  if (auth.kind === "missing-env") {
    return NextResponse.json({ error: "Supabase environment is not configured." }, { status: 500 });
  }

  const { id } = await params;
  const source = await getPolicySourceById(id).catch(() => null);
  if (!source) {
    return NextResponse.json({ error: "Source not found." }, { status: 404 });
  }

  let fetchResult = await getLatestSuccessfulFetchLog(id);
  if (!fetchResult) {
    const fetched = await fetchPolicySource({ id: source.id, url: source.url });
    if (!fetched.ok) {
      return NextResponse.redirect(new URL(`/admin/sources/${source.id}`, request.url));
    }
    fetchResult = fetched.log;
  }

  const rawHtml = String(fetchResult.metadata?.raw_html ?? "");
  const extracted = extractAndClassifyDocument({
    html: rawHtml,
    url: fetchResult.final_url ?? source.final_url ?? source.url,
    title: source.title,
  });
  const versionResult = await createVersionIfChanged({
    source,
    finalUrl: fetchResult.final_url,
    markdownText: extracted.markdownText,
    plainText: extracted.plainText,
    extractionMethod: "html_extractor",
    extractionConfidence: extracted.extractionConfidence,
  });

  await processDocumentVersion({
    versionId: versionResult.version.id,
    markdownText: versionResult.version.markdown_text ?? extracted.markdownText,
  });

  await updatePolicySourceContentClassification(source.id, {
    content_document_type: extracted.classification.documentType,
    content_source_tier: extracted.classification.sourceTier,
    content_use_for_scoring: extracted.classification.useForScoring,
    content_monitor_enabled: extracted.classification.monitorEnabled,
    content_confidence: extracted.classification.confidence,
    content_classification_reasons:
      extracted.classification.classificationReasons,
    content_classified_at: new Date().toISOString(),
  });

  return NextResponse.redirect(
    new URL(`/admin/sources/${source.id}/versions/${versionResult.version.id}`, request.url),
  );
}
