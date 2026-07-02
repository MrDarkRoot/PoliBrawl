import Link from "next/link";

import { archivePlatformAction } from "@/features/platforms/actions/platform.actions";
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
import type { Platform } from "@/types/polibrawl";

const futureModules = [
  {
    label: "Sources",
    href: (platformId: string) => `/admin/sources?platform_id=${platformId}`,
    disabled: false,
    helper: "Open the active Source Registry for this platform.",
    buttonLabel: "Open",
  },
  {
    label: "Candidates",
    href: () => "#",
    disabled: true,
    helper: "Available in a later sprint.",
    buttonLabel: "Later",
  },
  {
    label: "Red Flags",
    href: () => "#",
    disabled: true,
    helper: "Available in a later sprint.",
    buttonLabel: "Later",
  },
  {
    label: "Evidence",
    href: () => "#",
    disabled: true,
    helper: "Available in a later sprint.",
    buttonLabel: "Later",
  },
  {
    label: "Survival Notes",
    href: () => "#",
    disabled: true,
    helper: "Available in a later sprint.",
    buttonLabel: "Later",
  },
  {
    label: "Backup Options",
    href: () => "#",
    disabled: true,
    helper: "Available in a later sprint.",
    buttonLabel: "Later",
  },
  {
    label: "Checklist",
    href: () => "#",
    disabled: true,
    helper: "Available in a later sprint.",
    buttonLabel: "Later",
  },
  {
    label: "Publisher Preview",
    href: () => "#",
    disabled: true,
    helper: "Available in a later sprint.",
    buttonLabel: "Later",
  },
] as const;

export function PlatformDetailPanel({ platform }: { platform: Platform }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
      <Card>
        <CardHeader>
          <CardTitle>Platform Metadata</CardTitle>
          <CardDescription>
            Core registry metadata for this PoliBrawl platform record.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center justify-between gap-4">
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
            <span className="font-medium">{toTitleCase(platform.category)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Main Level</span>
            <span className="font-medium">
              {platform.main_level ? toTitleCase(platform.main_level) : "Not set"}
            </span>
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
            <span className="text-muted-foreground">Last Reviewed</span>
            <span className="font-medium">{formatDateTime(platform.last_reviewed_at)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Created</span>
            <span className="font-medium">{formatDateTime(platform.created_at)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Updated</span>
            <span className="font-medium">{formatDateTime(platform.updated_at)}</span>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-muted-foreground">Summary</p>
            <p className="leading-6">
              {platform.summary ?? "No summary has been written for this platform yet."}
            </p>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-muted-foreground">Internal Notes</p>
            <p className="leading-6">
              {platform.internal_notes ?? "No internal notes have been recorded yet."}
            </p>
          </div>
          <Separator />
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/admin/platforms/${platform.id}/edit`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Edit Platform
            </Link>
            <form action={archivePlatformAction}>
              <input type="hidden" name="platform_id" value={platform.id} />
              <Button
                type="submit"
                variant="destructive"
                disabled={platform.status === "archived"}
              >
                Archive Platform
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Future Modules</CardTitle>
          <CardDescription>
            These modules are intentionally not built in Sprint 2.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {futureModules.map((module) => (
            <div
              key={module.label}
              className="flex items-center justify-between rounded-2xl border border-border/70 p-4"
            >
              <div>
                <p className="font-medium">{module.label}</p>
                <p className="text-sm text-muted-foreground">{module.helper}</p>
              </div>
              {module.disabled ? (
                <Button type="button" variant="outline" disabled>
                  {module.buttonLabel}
                </Button>
              ) : (
                <Link
                  href={module.href(platform.id)}
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  {module.buttonLabel}
                </Link>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
