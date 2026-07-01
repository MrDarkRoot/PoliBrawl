import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDocumentVersionById } from "@/server/repositories/document-repository";

export default async function VersionDetailPage({
  params,
}: {
  params: Promise<{ id: string; versionId: string }>;
}) {
  const { versionId } = await params;
  const version = await getDocumentVersionById(versionId).catch(() => null);

  if (!version) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic 4"
        title={`Version ${version.version_number}`}
        description={`Hash ${version.text_hash}`}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Markdown</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto whitespace-pre-wrap text-sm">
              {version.markdown_text ?? "No markdown text stored."}
            </pre>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Plain text</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto whitespace-pre-wrap text-sm">
              {version.plain_text ?? "No plain text stored."}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
