import { notFound } from "next/navigation";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
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
      <EmptyState
        title="Discovery history will appear here."
        description="The discovery service and run detail views are implemented in the next feature patch."
      />
    </div>
  );
}
