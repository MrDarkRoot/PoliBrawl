import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getSourceCandidateById } from "@/server/repositories/discovery-repository";

export default async function SourceCandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidate = await getSourceCandidateById(id).catch(() => null);

  if (!candidate) {
    notFound();
  }

  const hasPreview = Boolean(candidate.content_preview_fetched_at);
  const hasConflict =
    candidate.content_document_type &&
    candidate.suggested_document_type &&
    candidate.content_document_type !== candidate.suggested_document_type;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic 3"
        title={candidate.title ?? "Candidate detail"}
        description={candidate.url}
        actions={
          <div className="flex flex-wrap gap-3">
            <form action={`/api/source-candidates/${candidate.id}/preview-classify`} method="post">
              <button className={cn(buttonVariants({ variant: "outline" }))}>
                Fetch preview + classify content
              </button>
            </form>
            <form action={`/api/source-candidates/${candidate.id}/approve`} method="post">
              <button className={cn(buttonVariants())}>Approve candidate</button>
            </form>
          </div>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Candidate metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge value={candidate.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Filter decision</span>
              <StatusBadge value={candidate.filter_decision ?? "maybe"} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Filter score</span>
              <span>{candidate.filter_score ?? 0}</span>
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground">Filter reasons</p>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(candidate.filter_reasons) ? candidate.filter_reasons : []).map(
                  (reason: unknown) => (
                    <Badge key={String(reason)} variant="outline">
                      {String(reason)}
                    </Badge>
                  ),
                )}
              </div>
            </div>
            <div className="space-y-1 rounded-2xl border border-border/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                URL suggestion
              </p>
              <p className="mt-2 font-medium">
                {candidate.suggested_document_type ?? "other"} ·{" "}
                {candidate.suggested_tier ?? "tier_3_context"}
              </p>
              <p className="text-muted-foreground">
                confidence {candidate.confidence ?? "-"}
              </p>
            </div>
            <div className="space-y-1 rounded-2xl border border-border/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Content suggestion
              </p>
              {hasPreview ? (
                <>
                  <p className="mt-2 font-medium">
                    {candidate.content_document_type ?? "other"} ·{" "}
                    {candidate.content_source_tier ?? "tier_3_context"}
                  </p>
                  <p className="text-muted-foreground">
                    confidence {candidate.content_confidence ?? "-"} · fetched{" "}
                    {formatDateTime(candidate.content_preview_fetched_at)}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-muted-foreground">
                  No preview has been fetched for this candidate.
                </p>
              )}
            </div>
            {hasConflict ? (
              <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
                Conflict warning: URL suggestion is{" "}
                {candidate.suggested_document_type}, but content suggestion is{" "}
                {candidate.content_document_type}.
              </div>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Preview content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasPreview ? (
              <>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">Preview final URL</p>
                  <a
                    href={candidate.content_preview_final_url ?? candidate.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium hover:underline"
                  >
                    {candidate.content_preview_final_url ?? candidate.url}
                  </a>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Classification reasons
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      Array.isArray(candidate.content_classification_reasons)
                        ? candidate.content_classification_reasons
                        : []
                    ).map((reason: unknown) => (
                      <Badge key={String(reason)} variant="outline">
                        {String(reason)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="mb-2 text-sm font-medium">Markdown preview</p>
                    <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-2xl border border-border/70 bg-zinc-50 p-4 text-sm">
                      {candidate.content_preview_markdown ?? "No markdown preview."}
                    </pre>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium">Plain text preview</p>
                    <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-2xl border border-border/70 bg-zinc-50 p-4 text-sm">
                      {candidate.content_preview_plain_text ?? "No plain text preview."}
                    </pre>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Fetch a preview to inspect extracted content and content-based classification before approval.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
