import Link from "next/link";

import { archivePlatformAction } from "@/features/platforms/actions/platform.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDateTime, toTitleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Platform } from "@/types/polibrawl";

export function PlatformTable({ platforms }: { platforms: Platform[] }) {
  return (
    <Card>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border/70 text-left text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Slug</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Main Level</th>
                <th className="px-6 py-3 font-medium">Last Reviewed</th>
                <th className="px-6 py-3 font-medium">Updated</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {platforms.map((platform) => (
                <tr key={platform.id} className="border-b border-border/60 align-top">
                  <td className="px-6 py-4 font-medium">{platform.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{platform.slug}</td>
                  <td className="px-6 py-4">{toTitleCase(platform.category)}</td>
                  <td className="px-6 py-4">
                    <StatusBadge value={platform.status} />
                  </td>
                  <td className="px-6 py-4">
                    {platform.main_level ? toTitleCase(platform.main_level) : "Not set"}
                  </td>
                  <td className="px-6 py-4">{formatDateTime(platform.last_reviewed_at)}</td>
                  <td className="px-6 py-4">{formatDateTime(platform.updated_at)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/platforms/${platform.id}`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/platforms/${platform.id}/edit`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/admin/platforms/${platform.id}/intelligence`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        Intelligence
                      </Link>
                      <form action={archivePlatformAction}>
                        <input type="hidden" name="platform_id" value={platform.id} />
                        <Button
                          type="submit"
                          variant="destructive"
                          size="sm"
                          disabled={platform.status === "archived"}
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
