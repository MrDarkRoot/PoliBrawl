import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth";
import { sourceImportSchema } from "@/lib/validation/source";
import { getPolicySourceById } from "@/server/repositories/source-repository";
import { processDocumentVersion } from "@/server/services/documents/processor";
import { createVersionIfChanged } from "@/server/services/versioning/version-manager";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdminAccess();

  const { id } = await params;
  const source = await getPolicySourceById(id).catch(() => null);
  if (!source) {
    return NextResponse.json({ error: "Source not found." }, { status: 404 });
  }

  const formData = await request.formData();
  const parsed = sourceImportSchema.safeParse({
    markdown_text: formData.get("markdown_text"),
    plain_text: formData.get("plain_text"),
    extraction_method: "manual_import",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
  }

  const versionResult = await createVersionIfChanged({
    source,
    markdownText: parsed.data.markdown_text,
    plainText: parsed.data.plain_text ?? parsed.data.markdown_text,
    extractionMethod: parsed.data.extraction_method,
    extractionConfidence: 0.95,
    effectiveDate: parsed.data.effective_date ?? null,
  });

  await processDocumentVersion({
    versionId: versionResult.version.id,
    markdownText: versionResult.version.markdown_text ?? parsed.data.markdown_text,
  });

  return NextResponse.redirect(
    new URL(`/admin/sources/${source.id}/versions/${versionResult.version.id}`, request.url),
  );
}
