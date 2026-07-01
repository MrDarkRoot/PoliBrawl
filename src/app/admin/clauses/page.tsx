import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listClauses } from "@/server/repositories/document-repository";

export default async function ClausesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const clauses = await listClauses({
    search: typeof resolved.search === "string" ? resolved.search : undefined,
  }).catch(() => []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic 5"
        title="Clauses"
        description="Inspect processed clause text and navigate back to versions and sources."
      />
      <div className="grid gap-4">
        {clauses.map((clause) => (
          <Card key={clause.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                <Link href={`/admin/clauses/${clause.id}`} className="hover:underline">
                  {clause.sections?.heading ?? "Untitled section"}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="line-clamp-4 text-muted-foreground">{clause.clause_text}</p>
              <p className="text-xs text-muted-foreground">
                Hash: {clause.clause_hash} · Words: {clause.word_count}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
