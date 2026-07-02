import { notFound } from "next/navigation";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { listDiscoveryRunsForPlatform } from "@/server/repositories/discovery-repository";
import { getPlatformById } from "@/server/repositories/platform-repository";

export default async function PlatformDiscoveryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const platform = await getPlatformById(id).catch(() => null);

  if (!platform) {
    notFound();
  }

  const runs = await listDiscoveryRunsForPlatform(id).catch(() => []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic 2"
        title={`Discovery for ${platform.name}`}
        description="Kick off homepage, robots, sitemap, and path-based source discovery for this platform."
      />
      <Card>
        <CardHeader>
          <CardTitle>Run discovery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-sm text-muted-foreground">
          <p>
            Discovery uses the platform website URL, then stores candidate policy
            sources for editorial review.
          </p>
          <form action={`/api/discovery/runs?platformId=${platform.id}`} method="post">
            <Button type="submit">Start discovery run</Button>
          </form>
          <p>Last reviewed: {formatDateTime(platform.last_reviewed_at)}</p>
        </CardContent>
      </Card>
      {runs.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent discovery runs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {runs.map((run) => (
              <div
                key={run.id}
                className="flex flex-col gap-3 rounded-2xl border border-border/70 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{run.status.replaceAll("_", " ")}</p>
                  <p className="text-muted-foreground">
                    Started {formatDateTime(run.started_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/admin/discovery/runs/${run.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    View run
                  </Link>
                  <Link
                    href="/admin/sources/candidates"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Review candidates
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          title="No discovery runs yet."
          description="Start a discovery run for this platform, then review the candidates from the run detail page or the candidate queue."
        />
      )}
    </div>
  );
}
