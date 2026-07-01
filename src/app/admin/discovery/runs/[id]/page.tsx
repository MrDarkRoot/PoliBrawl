import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getDiscoveryRunById } from "@/server/repositories/discovery-repository";

export default async function DiscoveryRunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getDiscoveryRunById(id).catch(() => null);

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic 2"
        title="Discovery run detail"
        description={`Run ${data.run.id} for ${data.run.website_url}`}
        actions={
          <Link
            href="/admin/sources/candidates"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Open candidate queue
          </Link>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Run summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Status</p>
            <StatusBadge value={data.run.status} />
          </div>
          <div>
            <p className="text-muted-foreground">Started</p>
            <p>{formatDateTime(data.run.started_at)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Completed</p>
            <p>{formatDateTime(data.run.completed_at)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Error</p>
            <p>{data.run.error_message ?? "None"}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Discovered candidates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.candidates.map((candidate) => (
            <div key={candidate.id} className="rounded-2xl border border-border/70 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <a
                    href={candidate.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium hover:underline"
                  >
                    {candidate.url}
                  </a>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {candidate.suggested_document_type ?? "unclassified"} ·{" "}
                    {candidate.suggested_tier ?? "no tier"} ·{" "}
                    {candidate.detection_reason ?? "no reason"}
                  </p>
                </div>
                <StatusBadge value={candidate.status} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
