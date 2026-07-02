import Link from "next/link";

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
import type { SourceSnapshotDetail } from "@/types/polibrawl";

export function SourceSnapshotPanel({
  snapshot,
}: {
  snapshot: SourceSnapshotDetail;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <Card>
        <CardHeader>
          <CardTitle>Snapshot Metadata</CardTitle>
          <CardDescription>
            Private capture metadata for this source snapshot.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Source</span>
            <Link
              href={`/admin/sources/${snapshot.source_id}`}
              className="font-medium hover:underline"
            >
              {snapshot.source_title}
            </Link>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Platform</span>
            <Link
              href={`/admin/platforms/${snapshot.platform_id}`}
              className="font-medium hover:underline"
            >
              {snapshot.platform_name}
            </Link>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Capture Status</span>
            <StatusBadge value={snapshot.capture_status} />
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Capture Method</span>
            <span className="font-medium">{toTitleCase(snapshot.capture_method)}</span>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-muted-foreground">Original URL</p>
            <p className="break-all">{snapshot.original_url ?? "Not set"}</p>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-muted-foreground">Final URL</p>
            <p className="break-all">{snapshot.final_url ?? "Not set"}</p>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">HTTP Status</span>
            <span className="font-medium">{snapshot.http_status ?? "Not set"}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Content Type</span>
            <span className="font-medium">{snapshot.content_type ?? "Not set"}</span>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-muted-foreground">Content Hash</p>
            <p className="break-all font-mono text-xs">
              {snapshot.content_hash ?? "Not set"}
            </p>
          </div>
          <Separator />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-muted-foreground">Word Count</p>
              <p className="font-medium">
                {snapshot.word_count?.toLocaleString() ?? "Not set"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Byte Size</p>
              <p className="font-medium">
                {snapshot.byte_size?.toLocaleString() ?? "Not set"}
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Captured At</span>
            <span className="font-medium">{formatDateTime(snapshot.captured_at)}</span>
          </div>
          {snapshot.error_message ? (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-muted-foreground">Error Message</p>
                <p>{snapshot.error_message}</p>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Extracted Text</CardTitle>
          <CardDescription>
            Admin-only preview of the normalized source capture.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm whitespace-pre-wrap leading-6">
            {snapshot.text_preview ?? "No text preview is available for this snapshot."}
          </div>
          {snapshot.extracted_text ? (
            <details className="rounded-2xl border border-border/70 p-4">
              <summary className="cursor-pointer font-medium">
                Show full extracted text
              </summary>
              <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-sm leading-6">
                {snapshot.extracted_text}
              </pre>
            </details>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
