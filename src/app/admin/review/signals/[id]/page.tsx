import { notFound } from "next/navigation";

import { SignalApprovalForm } from "@/components/forms/signal-approval-form";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSignalCandidateById } from "@/server/repositories/signal-repository";

export default async function ReviewCandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidate = await getSignalCandidateById(id).catch(() => null);

  if (!candidate) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic 7"
        title={candidate.suggested_signal}
        description={candidate.clauses?.document_versions?.policy_sources?.platforms?.name ?? "Signal candidate"}
      />
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Candidate detail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge value={candidate.status} />
            </div>
            <p className="text-muted-foreground">
              {candidate.suggested_category.replaceAll("_", " ")} ·{" "}
              {candidate.suggested_level.replaceAll("_", " ")} · confidence{" "}
              {candidate.confidence ?? "-"}
            </p>
            <div className="rounded-2xl border border-border/70 bg-zinc-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Clause
              </p>
              <p className="mt-3 leading-7">{candidate.clauses?.clause_text}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Matched terms
              </p>
              <p className="mt-2">
                {Array.isArray(candidate.matched_terms)
                  ? candidate.matched_terms.join(", ")
                  : "None"}
              </p>
            </div>
            <form action={`/api/signal-candidates/${candidate.id}/reject`} method="post" className="space-y-3">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Reject reason</span>
                <textarea
                  name="reason"
                  className="min-h-28 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm"
                  defaultValue="Editorially invalid or insufficiently supported."
                />
              </label>
              <button className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-sm font-medium">
                Reject candidate
              </button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Approve signal</CardTitle>
          </CardHeader>
          <CardContent>
            <SignalApprovalForm
              candidateId={candidate.id}
              initialValues={{
                name: candidate.suggested_signal,
                category: candidate.suggested_category,
                level: candidate.suggested_level,
                confidence:
                  candidate.confidence && candidate.confidence >= 0.8
                    ? "high"
                    : candidate.confidence && candidate.confidence <= 0.4
                      ? "low"
                      : "medium",
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
