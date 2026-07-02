import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlatformTable } from "@/features/platforms/components/platform-table";
import { cn } from "@/lib/utils";
import { listPlatforms } from "@/server/polibrawl/repositories/platform.repository";
import { platformCategories, platformStatuses } from "@/types/polibrawl";

export default async function PlatformsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const search =
    typeof resolvedSearchParams.search === "string"
      ? resolvedSearchParams.search
      : undefined;
  const rawCategory =
    typeof resolvedSearchParams.category === "string"
      ? resolvedSearchParams.category
      : undefined;
  const rawStatus =
    typeof resolvedSearchParams.status === "string"
      ? resolvedSearchParams.status
      : undefined;
  const category = platformCategories.includes(
    rawCategory as (typeof platformCategories)[number],
  )
    ? (rawCategory as (typeof platformCategories)[number])
    : undefined;
  const status = platformStatuses.includes(
    rawStatus as (typeof platformStatuses)[number],
  )
    ? (rawStatus as (typeof platformStatuses)[number])
    : undefined;

  const platforms = await listPlatforms({
    search,
    category,
    status,
  }).catch(() => []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic B"
        title="Platform Registry"
        description="Create, browse, and archive PoliBrawl platform records with the new server-side platform repository."
        actions={
          <Link href="/admin/platforms/new" className={cn(buttonVariants())}>
            Create Platform
          </Link>
        }
      />
      <form className="grid gap-4 rounded-2xl border border-border/70 p-4 md:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            name="search"
            defaultValue={search ?? ""}
            placeholder="Search by name or slug"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            defaultValue={category ?? ""}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
          >
            <option value="">All categories</option>
            {platformCategories.map((item) => (
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
            {platformStatuses.map((item) => (
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
            href="/admin/platforms"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Reset
          </Link>
        </div>
      </form>

      {platforms.length ? (
        <PlatformTable platforms={platforms} />
      ) : (
        <EmptyState
          title="No platforms found"
          description="No platforms match the current filters yet. Create a platform or clear the filters."
          action={
            <Link href="/admin/platforms/new" className={cn(buttonVariants())}>
              Create Platform
            </Link>
          }
        />
      )}
    </div>
  );
}
