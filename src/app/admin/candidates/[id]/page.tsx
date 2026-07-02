import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ReviewActions } from "@/features/candidates/components/review-actions";
import { formatDateTime } from "@/lib/format";
import { listReviewHistory } from "@/server/polibrawl/repositories/candidate-review.repository";
import { queryOne } from "@/server/polibrawl/db";
import type { RedFlagCandidate } from "@/types/polibrawl";

export const metadata = { title: "Candidate Detail — PoliBrawl Admin" };

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const candidate = await queryOne<RedFlagCandidate & { platform_name: string; source_title: string }>(
    `SELECT rfc.*, p.name as platform_name, s.title as source_title
     FROM red_flag_candidates rfc
     JOIN platforms p ON rfc.platform_id = p.id
     JOIN sources s ON rfc.source_id = s.id
     WHERE rfc.id = $1`,
    [id]
  );

  if (!candidate) notFound();

  const history = await listReviewHistory(candidate.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader eyebrow="Candidate Review" title={candidate.headline} description="Editorial review page." />
        <StatusBadge value={candidate.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Excerpt</p>
                <div className="rounded-xl border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap">
                  {candidate.excerpt}
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Matched Keywords</p>
                <div className="flex flex-wrap gap-2">
                  {candidate.matched_keywords.map((kw) => (
                    <span key={kw} className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs text-white">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Review History</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No review history.</p>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <div key={item.id} className="text-sm border-l-2 pl-4 py-1">
                      <p className="font-medium capitalize">{item.action.replace('_', ' ')}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {formatDateTime(item.created_at)}
                      </p>
                      {item.note && <p className="mt-1 text-muted-foreground italic">&quot;{item.note}&quot;</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewActions candidateId={candidate.id} currentStatus={candidate.status} />
              
              {candidate.status === "reviewing" && (
                <div className="mt-4 pt-4 border-t">
                  <Link 
                    href={`/admin/candidates/${candidate.id}/merge`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    Merge with another candidate...
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Category:</span>{" "}
                <span className="font-medium capitalize">{candidate.category}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Platform:</span>{" "}
                <Link href={`/admin/platforms/${candidate.platform_id}`} className="font-medium hover:underline">
                  {candidate.platform_name}
                </Link>
              </div>
              <div>
                <span className="text-muted-foreground">Source:</span>{" "}
                <Link href={`/admin/sources/${candidate.source_id}`} className="font-medium hover:underline">
                  {candidate.source_title}
                </Link>
              </div>
              {candidate.source_snapshot_id && (
                <div>
                  <span className="text-muted-foreground">Snapshot:</span>{" "}
                  <Link href={`/admin/sources/${candidate.source_id}/snapshots/${candidate.source_snapshot_id}`} className="font-medium hover:underline">
                    View
                  </Link>
                </div>
              )}
              {candidate.confidence_note && (
                <div>
                  <span className="text-muted-foreground">Note:</span>{" "}
                  <span>{candidate.confidence_note}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
