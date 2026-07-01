import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getSignalById } from "@/server/repositories/signal-repository";

export default async function SignalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const candidateId =
    typeof resolvedSearchParams.candidate === "string"
      ? resolvedSearchParams.candidate
      : undefined;

  const data = await getSignalById(id).catch(() => null);

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic 7"
        title={data.signal.name}
        description={data.signal.platforms?.name ?? "Approved signal"}
        actions={
          <Link
            href={
              candidateId
                ? `/admin/signals/${data.signal.id}/evidence/new?candidateId=${candidateId}`
                : `/admin/signals/${data.signal.id}/evidence/new`
            }
            className={cn(buttonVariants())}
          >
            Build evidence
          </Link>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Signal metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge value={data.signal.status} />
            </div>
            <p>{data.signal.category.replaceAll("_", " ")}</p>
            <p>{data.signal.level.replaceAll("_", " ")} · {data.signal.confidence}</p>
            <p className="leading-7 text-muted-foreground">
              {data.signal.explanation ?? "No public explanation has been added yet."}
            </p>
            <div className="rounded-2xl border border-border/70 bg-zinc-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Internal notes
              </p>
              <p className="mt-3 leading-7">
                {data.signal.internal_reason ?? "No internal notes stored."}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Evidence items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.evidence.length ? (
              data.evidence.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border/70 p-4">
                  <p className="font-medium">{item.document_title ?? "Evidence item"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.explanation}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No evidence has been attached to this signal yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
