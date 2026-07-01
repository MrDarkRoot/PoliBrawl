import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { listFetchLogs, getPolicySourceById } from "@/server/repositories/source-repository";

export default async function SourceLogsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [source, logs] = await Promise.all([
    getPolicySourceById(id).catch(() => null),
    listFetchLogs(id).catch(() => []),
  ]);

  if (!source) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic 4"
        title="Fetch logs"
        description={`Fetch history for ${source.title ?? source.url}`}
      />
      <div className="grid gap-4">
        {logs.map((log) => (
          <Card key={log.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {log.success ? "Successful fetch" : "Failed fetch"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>{formatDateTime(log.fetched_at)}</p>
              <p>Status: {log.http_status ?? "n/a"}</p>
              <p>Requested: {log.requested_url}</p>
              <p>Final: {log.final_url ?? "n/a"}</p>
              <p>Error: {log.error_message ?? "None"}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
