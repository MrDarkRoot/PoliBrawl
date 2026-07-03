import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { candidateFilterDecisions } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { listSourceCandidates } from "@/server/repositories/discovery-repository";

function parseDecisionFilter(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value.join(",") : value ?? "keep,maybe";
  const selected = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry): entry is (typeof candidateFilterDecisions)[number] =>
      candidateFilterDecisions.includes(
        entry as (typeof candidateFilterDecisions)[number],
      ),
    );

  return selected.length ? selected : ["keep", "maybe"];
}

export default async function SourceCandidatesPage({
  searchParams,
}: {
  searchParams?: Promise<{ decisions?: string | string[] }>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const selectedDecisions = parseDecisionFilter(resolvedSearchParams.decisions);
  const [visibleCandidates, allCandidates] = await Promise.all([
    listSourceCandidates({
      status: "pending",
      filterDecisions: selectedDecisions,
    }).catch(() => []),
    listSourceCandidates({
      status: "pending",
    }).catch(() => []),
  ]);

  const counts = allCandidates.reduce(
    (acc, candidate) => {
      const key = candidate.filter_decision ?? "maybe";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic 3"
        title="Candidate queue"
        description="Review filtered discovery candidates before promoting policy documents into the source registry."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/sources/candidates?decisions=keep,maybe"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Default queue
            </Link>
            <Link
              href="/admin/sources/candidates?decisions=keep"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Keep only
            </Link>
            <Link
              href="/admin/sources/candidates?decisions=maybe"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Maybe only
            </Link>
            <Link
              href="/admin/sources/candidates?decisions=drop"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Dropped
            </Link>
          </div>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Queue filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm">
          {candidateFilterDecisions.map((decision) => (
            <div key={decision} className="rounded-2xl border border-border/70 px-4 py-3">
              <p className="text-muted-foreground">{decision}</p>
              <p className="mt-1 text-lg font-semibold">{counts[decision] ?? 0}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="grid gap-4">
        {visibleCandidates.map((candidate) => (
          <Card key={candidate.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-lg">
                    <Link
                      href={`/admin/sources/candidates/${candidate.id}`}
                      className="hover:underline"
                    >
                      {candidate.platforms?.name ?? "Platform"} ·{" "}
                      {candidate.title ?? "Untitled candidate"}
                    </Link>
                  </CardTitle>
                  <a
                    href={candidate.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {candidate.url}
                  </a>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge value={candidate.status} />
                  <StatusBadge value={candidate.filter_decision ?? "maybe"} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                URL suggestion: {candidate.suggested_document_type ?? "other"} ·{" "}
                {candidate.suggested_tier ?? "tier_3_context"} · confidence{" "}
                {candidate.confidence ?? "-"} · filter score{" "}
                {candidate.filter_score ?? 0}
              </p>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(candidate.filter_reasons)
                  ? candidate.filter_reasons
                  : []
                ).slice(0, 6).map((reason: unknown) => (
                  <Badge key={String(reason)} variant="outline">
                    {String(reason)}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <form action={`/api/source-candidates/${candidate.id}/approve`} method="post">
                  <button className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground">
                    Approve
                  </button>
                </form>
                <form action={`/api/source-candidates/${candidate.id}/reject`} method="post">
                  <button className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-sm font-medium">
                    Reject
                  </button>
                </form>
                <Link
                  href={`/admin/sources/candidates/${candidate.id}`}
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  Inspect
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
