import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import { listDocumentVersions } from "@/server/repositories/document-repository";
import { listFetchLogs, getPolicySourceById } from "@/server/repositories/source-repository";

export default async function SourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const source = await getPolicySourceById(id).catch(() => null);

  if (!source) {
    notFound();
  }

  const [logs, versions] = await Promise.all([
    listFetchLogs(id).catch(() => []),
    listDocumentVersions(id).catch(() => []),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic 4"
        title={source.title ?? source.document_type.replaceAll("_", " ")}
        description={source.url}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <form action={`/api/sources/${source.id}/fetch`} method="post">
              <button className={cn(buttonVariants())}>Fetch source</button>
            </form>
            <form action={`/api/sources/${source.id}/process`} method="post">
              <button className={cn(buttonVariants({ variant: "outline" }))}>
                Process version
              </button>
            </form>
            <Link
              href={`/admin/sources/${source.id}/edit`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Edit source
            </Link>
            <Link
              href={`/admin/sources/${source.id}/import`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Manual import
            </Link>
          </div>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Source metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge value={source.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tier</span>
              <span>{source.source_tier.replaceAll("_", " ")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Monitor</span>
              <span>{source.monitor_enabled ? "Enabled" : "Disabled"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current hash</span>
              <span className="truncate pl-4 text-right text-xs">
                {source.current_hash ?? "Not generated"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last fetched</span>
              <span>{formatDateTime(source.last_fetched_at)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <p className="text-sm font-medium">Recent fetch logs</p>
              {logs.slice(0, 3).map((log) => (
                <div key={log.id} className="rounded-2xl border border-border/70 p-4 text-sm">
                  <p className="font-medium">{log.success ? "Successful fetch" : "Failed fetch"}</p>
                  <p className="text-muted-foreground">
                    {formatDateTime(log.fetched_at)} · {log.http_status ?? "n/a"}
                  </p>
                </div>
              ))}
              <Link
                href={`/admin/sources/${source.id}/logs`}
                className="text-sm font-medium text-foreground hover:underline"
              >
                View all logs
              </Link>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium">Recent versions</p>
              {versions.slice(0, 3).map((version) => (
                <div key={version.id} className="rounded-2xl border border-border/70 p-4 text-sm">
                  <p className="font-medium">Version {version.version_number}</p>
                  <p className="text-muted-foreground">
                    {version.review_status.replaceAll("_", " ")} ·{" "}
                    {formatDateTime(version.fetched_at)}
                  </p>
                </div>
              ))}
              <Link
                href={`/admin/sources/${source.id}/versions`}
                className="text-sm font-medium text-foreground hover:underline"
              >
                View all versions
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
