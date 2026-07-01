import Link from "next/link";

import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listSignalCandidates } from "@/server/repositories/signal-repository";

export default async function ReviewPage() {
  const candidates = await listSignalCandidates({ status: "pending" }).catch(() => []);
  const deeperReview = await listSignalCandidates({
    status: "needs_deeper_review",
  }).catch(() => []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic 7"
        title="Review workbench"
        description="Approve or reject signal candidates and progress them into evidence-backed editorial output."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard label="Pending review" value={candidates.length} />
        <MetricCard label="Needs deeper review" value={deeperReview.length} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Current queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {candidates.slice(0, 10).map((candidate) => (
            <Link
              key={candidate.id}
              href={`/admin/review/signals/${candidate.id}`}
              className="block rounded-2xl border border-border/70 p-4 hover:bg-zinc-50"
            >
              <p className="font-medium">{candidate.suggested_signal}</p>
              <p className="text-sm text-muted-foreground">
                {candidate.platforms?.name ?? "Platform"} ·{" "}
                {candidate.suggested_category.replaceAll("_", " ")}
              </p>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
