import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSafeWordingWarnings } from "@/lib/evidence";
import { getEvidenceById, getSignalById } from "@/server/repositories/signal-repository";

export default async function EvidencePreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const evidenceId =
    typeof resolvedSearchParams.evidenceId === "string"
      ? resolvedSearchParams.evidenceId
      : undefined;

  const [signal, evidence] = await Promise.all([
    getSignalById(id).catch(() => null),
    evidenceId ? getEvidenceById(evidenceId).catch(() => null) : Promise.resolve(null),
  ]);

  if (!signal || !evidence) {
    notFound();
  }

  const warnings = getSafeWordingWarnings({
    explanation: evidence.explanation,
    whyItMatters: evidence.why_it_matters,
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic 7"
        title="Evidence preview"
        description={`Draft preview for ${signal.signal.name}`}
      />
      <Card>
        <CardHeader>
          <CardTitle>{evidence.document_title ?? "Evidence item"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          {warnings.length ? (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
              {warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          ) : null}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Clause excerpt
            </p>
            <p className="mt-3 leading-7">{evidence.clause_excerpt}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Explanation
            </p>
            <p className="mt-3 leading-7">{evidence.explanation}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Why it matters
            </p>
            <p className="mt-3 leading-7">{evidence.why_it_matters}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
