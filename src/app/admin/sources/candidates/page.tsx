import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listSourceCandidates } from "@/server/repositories/discovery-repository";

export default async function SourceCandidatesPage() {
  const candidates = await listSourceCandidates({ status: "pending" }).catch(() => []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic 3"
        title="Candidate queue"
        description="Review discovered source candidates and promote real policy documents into the source registry."
      />
      <div className="grid gap-4">
        {candidates.map((candidate) => (
          <Card key={candidate.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-lg">
                    {candidate.platforms?.name ?? "Platform"} ·{" "}
                    {candidate.title ?? "Untitled candidate"}
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
                <StatusBadge value={candidate.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {candidate.suggested_document_type ?? "other"} ·{" "}
                {candidate.suggested_tier ?? "tier_3_context"} · confidence{" "}
                {candidate.confidence ?? "-"}
              </p>
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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
