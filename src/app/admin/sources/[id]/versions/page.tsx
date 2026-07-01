import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { listDocumentVersions } from "@/server/repositories/document-repository";
import { getPolicySourceById } from "@/server/repositories/source-repository";

export default async function SourceVersionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [source, versions] = await Promise.all([
    getPolicySourceById(id).catch(() => null),
    listDocumentVersions(id).catch(() => []),
  ]);

  if (!source) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic 4"
        title="Document versions"
        description={`Version history for ${source.title ?? source.url}`}
      />
      <div className="grid gap-4">
        {versions.map((version) => (
          <Card key={version.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                <Link href={`/admin/sources/${source.id}/versions/${version.id}`} className="hover:underline">
                  Version {version.version_number}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>{formatDateTime(version.fetched_at)}</p>
              <p>{version.review_status.replaceAll("_", " ")}</p>
              <p className="truncate">Hash: {version.text_hash}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
