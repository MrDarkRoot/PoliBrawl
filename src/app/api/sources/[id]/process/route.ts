import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth";
import { getLatestSuccessfulFetchLog, getPolicySourceById } from "@/server/repositories/source-repository";
import { extractPolicyText } from "@/server/services/extraction/html";
import { htmlToMarkdown } from "@/server/services/extraction/markdown";
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
  const extraction = extractPolicyText(rawHtml);
  const markdownText = htmlToMarkdown(rawHtml);
  const versionResult = await createVersionIfChanged({
    source,
    finalUrl: fetchResult.final_url,
    markdownText,
    plainText: extraction.plainText,
    extractionMethod: "html_extractor",
    extractionConfidence: extraction.extractionConfidence,
  });

  await processDocumentVersion({
    versionId: versionResult.version.id,
    markdownText: versionResult.version.markdown_text ?? markdownText,
  });

  return NextResponse.redirect(
    new URL(`/admin/sources/${source.id}/versions/${versionResult.version.id}`, request.url),
  );
}
