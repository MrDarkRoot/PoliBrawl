import Link from "next/link";

import { archiveSourceAction } from "@/features/sources/actions/source.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDateTime, toTitleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SourceListItem } from "@/types/polibrawl";

export function SourceTable({ sources }: { sources: SourceListItem[] }) {
  return (
    <Card>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border/70 text-left text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Title</th>
                <th className="px-6 py-3 font-medium">Platform</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Priority</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">URL</th>
                <th className="px-6 py-3 font-medium">Last Checked</th>
                <th className="px-6 py-3 font-medium">Last Reviewed</th>
                <th className="px-6 py-3 font-medium">Updated</th>
                <th className="px-6 py-3 font-medium">Latest Capture</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id} className="border-b border-border/60 align-top">
                  <td className="px-6 py-4 font-medium">{source.title}</td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p>{source.platform_name}</p>
                      <p className="text-xs text-muted-foreground">{source.platform_slug}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">{toTitleCase(source.source_type)}</td>
                  <td className="px-6 py-4">{toTitleCase(source.priority)}</td>
                  <td className="px-6 py-4">
                    <StatusBadge value={source.status} />
                  </td>
                  <td className="px-6 py-4">
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="line-clamp-2 max-w-xs text-muted-foreground hover:underline"
                      >
                        {source.url}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">Paste only</span>
                    )}
                  </td>
                  <td className="px-6 py-4">{formatDateTime(source.last_checked_at)}</td>
                  <td className="px-6 py-4">{formatDateTime(source.last_reviewed_at)}</td>
                  <td className="px-6 py-4">{formatDateTime(source.updated_at)}</td>
                  <td className="px-6 py-4">
                    {source.latest_capture_status ? (
                      <div className="space-y-1">
                        <StatusBadge value={source.latest_capture_status} />
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(source.latest_captured_at)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No snapshot yet</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/sources/${source.id}`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/sources/${source.id}/edit`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/admin/sources/${source.id}/capture`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        Capture
                      </Link>
                      <form action={archiveSourceAction}>
                        <input type="hidden" name="source_id" value={source.id} />
                        <Button
                          type="submit"
                          variant="destructive"
                          size="sm"
                          disabled={source.status === "archived"}
                        >
                          Archive
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
