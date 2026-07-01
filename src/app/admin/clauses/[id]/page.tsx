import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getClauseById } from "@/server/repositories/document-repository";

export default async function ClauseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clause = await getClauseById(id).catch(() => null);

  if (!clause) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic 5"
        title={clause.sections?.heading ?? "Clause detail"}
        description={`Clause hash ${clause.clause_hash ?? "not generated"}`}
      />
      <Card>
        <CardHeader>
          <CardTitle>Clause text</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7">
          <p>{clause.clause_text}</p>
          <p className="text-muted-foreground">
            Word count: {clause.word_count} · Version{" "}
            {clause.document_versions?.version_number ?? "n/a"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
