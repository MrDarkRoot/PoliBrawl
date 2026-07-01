import Link from "next/link";
import { notFound } from "next/navigation";
import { FileSearch, Pencil, ScanSearch, Shapes } from "lucide-react";

import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  getPlatformById,
  getPlatformCoverage,
} from "@/server/repositories/platform-repository";

export default async function PlatformDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const platform = await getPlatformById(id).catch(() => null);

  if (!platform) {
    notFound();
  }

  const coverage = await getPlatformCoverage(id).catch(() => ({
    sources: 0,
    versions: 0,
    signals: 0,
    evidence: 0,
    tasks: [],
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic 1"
        title={platform.name}
        description={platform.summary ?? "No summary has been written for this platform yet."}
        actions={
          <>
            <Link
              href={`/admin/platforms/${platform.id}/edit`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit platform
            </Link>
            <Link
              href={`/admin/platforms/${platform.id}/discovery`}
              className={cn(buttonVariants())}
            >
              <ScanSearch className="mr-2 h-4 w-4" />
              Run discovery
            </Link>
          </>
        }
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Sources" value={coverage.sources} icon={<FileSearch className="h-4 w-4 text-muted-foreground" />} />
        <MetricCard label="Versions" value={coverage.versions} icon={<ScanSearch className="h-4 w-4 text-muted-foreground" />} />
        <MetricCard label="Signals" value={coverage.signals} icon={<Shapes className="h-4 w-4 text-muted-foreground" />} />
        <MetricCard label="Evidence" value={coverage.evidence} icon={<FileSearch className="h-4 w-4 text-muted-foreground" />} />
      </section>
      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Platform metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge value={platform.status} />
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Slug</span>
              <span className="font-medium">{platform.slug}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Category</span>
              <span className="font-medium">{platform.category.replaceAll("_", " ")}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Country</span>
              <span className="font-medium">{platform.country ?? "Not set"}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Website</span>
              <a
                href={platform.website_url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-zinc-950 hover:underline"
              >
                {platform.website_url}
              </a>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Last reviewed</span>
              <span className="font-medium">{formatDateTime(platform.last_reviewed_at)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Operational context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-medium">Internal notes</p>
              <p className="text-sm leading-6 text-muted-foreground">
                {platform.internal_notes ?? "No internal notes have been recorded yet."}
              </p>
            </div>
            <Separator />
            <div className="space-y-3">
              <p className="text-sm font-medium">Open editorial tasks</p>
              <div className="space-y-3">
                {coverage.tasks.length ? (
                  coverage.tasks.map((task) => (
                    <div key={task.id} className="rounded-2xl border border-border/70 p-4">
                      <p className="font-medium">{task.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {task.task_type.replaceAll("_", " ")} · {task.status.replaceAll("_", " ")}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No editorial tasks are linked to this platform.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
