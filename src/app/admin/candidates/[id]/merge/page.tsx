import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { queryMany, queryOne } from "@/server/polibrawl/db";
import type { RedFlagCandidate } from "@/types/polibrawl";
import { MergeForm } from "@/features/candidates/components/merge-form";

export const metadata = { title: "Merge Candidate — PoliBrawl Admin" };

export default async function MergeCandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const candidate = await queryOne<RedFlagCandidate & { platform_name: string }>(
    `SELECT rfc.*, p.name as platform_name
     FROM red_flag_candidates rfc
     JOIN platforms p ON rfc.platform_id = p.id
     WHERE rfc.id = $1`,
    [id]
  );

  if (!candidate || (candidate.status !== "pending" && candidate.status !== "reviewing")) {
    notFound();
  }

  const potentialTargets = await queryMany<RedFlagCandidate>(
    `SELECT * FROM red_flag_candidates 
     WHERE platform_id = $1 
       AND category = $2 
       AND id != $3
       AND status IN ('pending', 'reviewing')
     ORDER BY created_at DESC`,
    [candidate.platform_id, candidate.category, candidate.id]
  );

  return (
    <div className="space-y-8">
      <PageHeader 
        eyebrow="Merge Candidate" 
        title={candidate.headline} 
        description={`Platform: ${candidate.platform_name} | Category: ${candidate.category}`} 
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Source Candidate (This one)</CardTitle>
            <CardDescription>Will be marked as merged and hidden from the queue.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-medium text-muted-foreground mb-1">Keywords</p>
              <div className="flex flex-wrap gap-2">
                {candidate.matched_keywords.map((kw) => (
                  <span key={kw} className="rounded-full bg-zinc-900 px-2 py-0.5 text-xs text-white">{kw}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="font-medium text-muted-foreground mb-1">Excerpt</p>
              <div className="rounded border bg-muted/30 p-3 leading-relaxed whitespace-pre-wrap">{candidate.excerpt}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Target Candidate</CardTitle>
            <CardDescription>Select a candidate to merge into. Its excerpt will be kept, and keywords unioned.</CardDescription>
          </CardHeader>
          <CardContent>
            {potentialTargets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No eligible candidates found to merge into.</p>
            ) : (
              <MergeForm sourceCandidateId={candidate.id} potentialTargets={potentialTargets} />
            )}
          </CardContent>
        </Card>
      </div>
      
      <div>
        <Link href={`/admin/candidates/${candidate.id}`} className="text-sm text-blue-600 hover:underline">
          &larr; Back to Candidate Detail
        </Link>
      </div>
    </div>
  );
}
