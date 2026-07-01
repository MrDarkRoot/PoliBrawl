import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/tables/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listPlatforms } from "@/server/repositories/platform-repository";
import type { Platform } from "@/types/domain";

const columns: ColumnDef<Platform>[] = [
  {
    accessorKey: "name",
    header: "Platform",
    cell: ({ row }) => (
      <div className="space-y-1">
        <Link
          href={`/admin/platforms/${row.original.id}`}
          className="font-medium text-zinc-950 hover:underline"
        >
          {row.original.name}
        </Link>
        <p className="text-xs text-muted-foreground">{row.original.slug}</p>
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => row.original.category.replaceAll("_", " "),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge value={row.original.status} />,
  },
  {
    accessorKey: "country",
    header: "Country",
  },
  {
    accessorKey: "website_url",
    header: "Website",
    cell: ({ row }) => (
      <a
        href={row.original.website_url}
        target="_blank"
        rel="noreferrer"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        {row.original.website_url}
      </a>
    ),
  },
];

export default async function PlatformsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const platforms = await listPlatforms({
    search:
      typeof resolvedSearchParams.search === "string"
        ? resolvedSearchParams.search
        : undefined,
    category:
      typeof resolvedSearchParams.category === "string"
        ? resolvedSearchParams.category
        : undefined,
    status:
      typeof resolvedSearchParams.status === "string"
        ? resolvedSearchParams.status
        : undefined,
  }).catch(() => []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic 1"
        title="Platform registry"
        description="Create, browse, and manage the platform entities that anchor discovery, source, and signal workflows."
        actions={
          <Link href="/admin/platforms/new" className={cn(buttonVariants())}>
            Create platform
          </Link>
        }
      />
      <DataTable columns={columns} data={platforms} searchColumnId="name" />
    </div>
  );
}
