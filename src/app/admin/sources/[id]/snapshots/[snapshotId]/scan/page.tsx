import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { ScanForm } from "@/features/candidates/components/scan-form";
import { findSourceSnapshotDetailById } from "@/server/polibrawl/repositories/source-snapshot.repository";
import { listRedFlagCandidates } from "@/server/polibrawl/repositories/red-flag-candidate.repository";
import { listKeywordMatches } from "@/server/polibrawl/repositories/keyword-match.repository";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";

export const metadata = {
  title: "Scan Snapshot — PoliBrawl Admin",
  description: "Run the keyword scanner against a source snapshot.",
};

export default async function SnapshotScanPage({
  params,
}: {
  params: Promise<{ id: string; snapshotId: string }>;
}) {
  const { id, snapshotId } = await params;

  const snapshot = await findSourceSnapshotDetailById(id, snapshotId).catch(
    () => null,
  );

  if (!snapshot) {
    notFound();
  }

  // Load existing matches and candidates for this snapshot (persisted across runs)
  const [existingMatches, existingCandidates] = await Promise.all([
    listKeywordMatches({ source_snapshot_id: snapshotId }).catch(() => []),
    listRedFlagCandidates({ source_snapshot_id: snapshotId }).catch(() => []),
  ]);

  // Group matches by category for display
  const matchesByCategory = existingMatches.reduce<
    Record<string, typeof existingMatches>
  >((acc, m) => {
    const cat = m.category;
    acc[cat] = acc[cat] ? [...acc[cat], m] : [m];
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Keyword Scanner"
        title="Scan Snapshot"
        description={`Source: ${snapshot.source_title} · Platform: ${snapshot.platform_name}`}
      />

      {/* Context */}
      <Card>
        <CardHeader>
          <CardTitle>Snapshot Context</CardTitle>
          <CardDescription>
            Admin-only snapshot details. Extracted text is not publicly exposed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Platform</span>
            <Link
              href={`/admin/platforms/${snapshot.platform_id}`}
              className="font-medium hover:underline"
            >
              {snapshot.platform_name}
            </Link>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Source</span>
            <Link
              href={`/admin/sources/${snapshot.source_id}`}
              className="font-medium hover:underline"
            >
              {snapshot.source_title}
            </Link>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Capture Status</span>
            <StatusBadge value={snapshot.capture_status} />
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Word Count</span>
            <span className="font-medium">
              {snapshot.word_count?.toLocaleString() ?? "Unknown"}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Snapshot Detail</span>
            <Link
              href={`/admin/sources/${id}/snapshots/${snapshotId}`}
              className="text-sm hover:underline"
            >
              ← Back to snapshot
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Scanner form */}
      <ScanForm sourceSnapshotId={snapshotId} />

      {/* Existing keyword matches grouped by category */}
      {Object.keys(matchesByCategory).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold">
            Keyword Matches — {existingMatches.length} stored
          </h2>
          {Object.entries(matchesByCategory).map(([category, matches]) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold capitalize">
                  {category}
                </CardTitle>
                <CardDescription>
                  {matches.length} match{matches.length !== 1 ? "es" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {matches.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-lg border border-border/50 bg-muted/20 p-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-xs text-white">
                          {m.keyword}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          noise: {m.noise_score} · confidence: {m.confidence}
                        </span>
                        <StatusBadge value={m.status} />
                      </div>
                      <p className="mt-2 line-clamp-3 leading-relaxed text-muted-foreground">
                        {m.excerpt}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Existing candidates for this snapshot */}
      {existingCandidates.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold">
            Generated Candidates — {existingCandidates.length}
          </h2>
          {existingCandidates.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <CardTitle className="text-sm">{c.headline}</CardTitle>
                  <StatusBadge value={c.status} />
                </div>
                <CardDescription className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs capitalize">
                    {c.category}
                  </span>
                  {c.matched_keywords.map((kw) => (
                    <span
                      key={kw}
                      className="rounded-full border border-border/50 px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {kw}
                    </span>
                  ))}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4">
                  {c.excerpt}
                </p>
              </CardContent>
            </Card>
          ))}
          <p className="text-xs text-muted-foreground">
            Candidates are pending review. No red flags have been published.
          </p>
        </div>
      )}
    </div>
  );
}
