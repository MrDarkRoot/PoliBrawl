import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { listPolicySources } from "@/server/repositories/source-repository";

export default async function SourcesPage() {
  const sources = await listPolicySources().catch(() => []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic 3"
        title="Policy source registry"
        description="Browse all approved policy sources, their monitoring state, and their downstream versioning history."
        actions={
          <Link href="/admin/sources/new" className={cn(buttonVariants())}>
            Add source
          </Link>
        }
      />
      <div className="grid gap-4">
        {sources.map((source) => (
          <Card key={source.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-lg">
                    <Link href={`/admin/sources/${source.id}`} className="hover:underline">
                      {source.title ?? source.document_type.replaceAll("_", " ")}
                    </Link>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {source.platforms?.name ?? "Platform"} · {source.source_tier.replaceAll("_", " ")}
                  </p>
                </div>
                <StatusBadge value={source.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <a href={source.url} target="_blank" rel="noreferrer" className="hover:underline">
                {source.url}
              </a>
              <p className="text-muted-foreground">
                Monitor: {source.monitor_enabled ? "Enabled" : "Disabled"} · Scoreable:{" "}
                {source.use_for_scoring ? "Yes" : "No"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
