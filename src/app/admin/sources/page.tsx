import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SourceTable } from "@/features/sources/components/source-table";
import { cn } from "@/lib/utils";
import { listPlatforms } from "@/server/polibrawl/repositories/platform.repository";
import { listSources } from "@/server/polibrawl/repositories/source.repository";
import {
  sourcePriorities,
  sourceStatuses,
  sourceTypes,
} from "@/types/polibrawl";

export default async function SourcesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const search =
    typeof resolvedSearchParams.search === "string"
      ? resolvedSearchParams.search
      : undefined;
  const platformId =
    typeof resolvedSearchParams.platform_id === "string"
      ? resolvedSearchParams.platform_id
      : undefined;
  const rawSourceType =
    typeof resolvedSearchParams.source_type === "string"
      ? resolvedSearchParams.source_type
      : undefined;
  const rawPriority =
    typeof resolvedSearchParams.priority === "string"
      ? resolvedSearchParams.priority
      : undefined;
  const rawStatus =
    typeof resolvedSearchParams.status === "string"
      ? resolvedSearchParams.status
      : undefined;
  const sourceType = sourceTypes.includes(
    rawSourceType as (typeof sourceTypes)[number],
  )
    ? (rawSourceType as (typeof sourceTypes)[number])
    : undefined;
  const priority = sourcePriorities.includes(
    rawPriority as (typeof sourcePriorities)[number],
  )
    ? (rawPriority as (typeof sourcePriorities)[number])
    : undefined;
  const status = sourceStatuses.includes(
    rawStatus as (typeof sourceStatuses)[number],
  )
    ? (rawStatus as (typeof sourceStatuses)[number])
    : undefined;

  const [platforms, sources] = await Promise.all([
    listPlatforms().catch(() => []),
    listSources({
      search,
      platform_id: platformId,
      source_type: sourceType,
      priority,
      status,
    }).catch(() => []),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic B"
        title="Source Registry"
        description="Register important sources per platform, capture text privately, and prepare snapshots for the later keyword scanner."
        actions={
          <Link href="/admin/sources/new" className={cn(buttonVariants())}>
            Create Source
          </Link>
        }
      />

      <form className="grid gap-4 rounded-2xl border border-border/70 p-4 md:grid-cols-[minmax(0,1.1fr)_220px_220px_220px_220px_auto]">
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            name="search"
            defaultValue={search ?? ""}
            placeholder="Search by title or URL"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="platform_id">Platform</Label>
          <select
            id="platform_id"
            name="platform_id"
            defaultValue={platformId ?? ""}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
          >
            <option value="">All platforms</option>
            {platforms.map((platform) => (
              <option key={platform.id} value={platform.id}>
                {platform.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="source_type">Source Type</Label>
          <select
            id="source_type"
            name="source_type"
            defaultValue={sourceType ?? ""}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
          >
            <option value="">All source types</option>
            {sourceTypes.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <select
            id="priority"
            name="priority"
            defaultValue={priority ?? ""}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
          >
            <option value="">All priorities</option>
            {sourcePriorities.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={status ?? ""}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
          >
            <option value="">All statuses</option>
            {sourceStatuses.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-3">
          <button className={cn(buttonVariants())} type="submit">
            Apply
          </button>
          <Link
            href="/admin/sources"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Reset
          </Link>
        </div>
      </form>

      {sources.length ? (
        <SourceTable sources={sources} />
      ) : (
        <EmptyState
          title="No sources found"
          description="No sources match the current filters yet. Create a source or clear the filters."
          action={
            <Link href="/admin/sources/new" className={cn(buttonVariants())}>
              Create Source
            </Link>
          }
        />
      )}
    </div>
  );
}
