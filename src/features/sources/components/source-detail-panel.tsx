import Link from "next/link";

import { archiveSourceAction } from "@/features/sources/actions/source.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDateTime, toTitleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SourceListItem, SourceSnapshot } from "@/types/polibrawl";

type SourceDetailPanelProps = {
  source: SourceListItem;
  latestSnapshot: SourceSnapshot | null;
  snapshots: SourceSnapshot[];
};

export function SourceDetailPanel({
  source,
  latestSnapshot,
  snapshots,
}: SourceDetailPanelProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <Card>
        <CardHeader>
          <CardTitle>Source Metadata</CardTitle>
          <CardDescription>
            Private source registry metadata for the PoliBrawl capture pipeline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Status</span>
            <StatusBadge value={source.status} />
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Platform</span>
            <Link
              href={`/admin/platforms/${source.platform_id}`}
              className="font-medium hover:underline"
            >
              {source.platform_name}
            </Link>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Source Type</span>
            <span className="font-medium">{toTitleCase(source.source_type)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Priority</span>
            <span className="font-medium">{toTitleCase(source.priority)}</span>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-muted-foreground">URL</p>
            {source.url ? (
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="font-medium break-all hover:underline"
              >
                {source.url}
              </a>
            ) : (
              <p>No canonical URL recorded. Use paste capture instead.</p>
            )}
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Last Checked</span>
            <span className="font-medium">{formatDateTime(source.last_checked_at)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Last Reviewed</span>
            <span className="font-medium">{formatDateTime(source.last_reviewed_at)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Created</span>
            <span className="font-medium">{formatDateTime(source.created_at)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Updated</span>
            <span className="font-medium">{formatDateTime(source.updated_at)}</span>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-muted-foreground">Notes</p>
            <p className="leading-6">
              {source.notes ?? "No internal notes have been recorded yet."}
            </p>
          </div>
          <Separator />
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/admin/sources/${source.id}/edit`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Edit Source
            </Link>
            <Link
              href={`/admin/sources/${source.id}/capture`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Capture Source Text
            </Link>
            <form action={archiveSourceAction}>
              <input type="hidden" name="source_id" value={source.id} />
              <Button
                type="submit"
                variant="destructive"
                disabled={source.status === "archived"}
              >
                Archive Source
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Snapshot History</CardTitle>
          <CardDescription>
            Raw source captures stay private and feed the later keyword scanner.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {latestSnapshot ? (
            <div className="rounded-2xl border border-border/70 p-4 text-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">
                    Latest snapshot: {latestSnapshot.title ?? source.title}
                  </p>
                  <p className="text-muted-foreground">
                    {formatDateTime(latestSnapshot.captured_at)} ·{" "}
                    {toTitleCase(latestSnapshot.capture_method)}
                  </p>
                </div>
                <StatusBadge value={latestSnapshot.capture_status} />
              </div>
              <p className="mt-3 text-muted-foreground">
                {latestSnapshot.word_count
                  ? `${latestSnapshot.word_count.toLocaleString()} words`
                  : "No extracted text"}
                {latestSnapshot.http_status
                  ? ` · HTTP ${latestSnapshot.http_status}`
                  : ""}
              </p>
              {latestSnapshot.text_preview ? (
                <p className="mt-3 line-clamp-5 whitespace-pre-wrap leading-6">
                  {latestSnapshot.text_preview}
                </p>
              ) : (
                <p className="mt-3 text-muted-foreground">
                  {latestSnapshot.error_message ?? "No preview available."}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
              No snapshots yet. Run a fetch or paste capture to prepare this source for
              Sprint 4.
            </div>
          )}

          <div className="space-y-3">
            {snapshots.map((snapshot) => (
              <div
                key={snapshot.id}
                className="flex flex-col gap-3 rounded-2xl border border-border/70 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1 text-sm">
                  <p className="font-medium">
                    {snapshot.title ?? source.title} ·{" "}
                    {toTitleCase(snapshot.capture_method)}
                  </p>
                  <p className="text-muted-foreground">
                    {formatDateTime(snapshot.captured_at)} ·{" "}
                    {snapshot.word_count
                      ? `${snapshot.word_count.toLocaleString()} words`
                      : snapshot.error_message ?? "No extracted text"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge value={snapshot.capture_status} />
                  <Link
                    href={`/admin/sources/${source.id}/snapshots/${snapshot.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    View Snapshot
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
