import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { listRedFlagCandidatesWithContext } from "@/server/polibrawl/repositories/red-flag-candidate.repository";
import { formatDateTime } from "@/lib/format";

export const metadata = {
  title: "Candidates — PoliBrawl Admin",
  description: "Admin list of scanner-generated red-flag candidates.",
};

export default async function CandidatesListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  function firstString(
    v: string | string[] | undefined,
  ): string | undefined {
    if (!v) return undefined;
    return Array.isArray(v) ? v[0] : v;
  }

  const platform_id = firstString(params.platform_id);
  const category = firstString(params.category);
  const status = firstString(params.status);

  const candidates = await listRedFlagCandidatesWithContext({
    platform_id,
    category,
    status,
  }).catch(() => []);

  const categories = [
    "money",
    "account",
    "kyc",
    "payout",
    "appeal",
    "data_saas",
    "api",
    "legal",
  ];

  const statuses = [
    "pending",
    "reviewing",
    "approved",
    "rejected",
    "merged",
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Sprint 5"
        title="Red Flag Candidates"
        description="Candidate Review Pipeline. Pending candidates must be reviewed, approved, rejected, or merged."
      />

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{candidates.filter(c => c.status === 'pending').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Reviewing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{candidates.filter(c => c.status === 'reviewing').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{candidates.filter(c => c.status === 'approved').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{candidates.filter(c => c.status === 'rejected').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Merged</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{candidates.filter(c => c.status === 'merged').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3 text-sm">
        <select
          name="category"
          defaultValue={category ?? ""}
          className="rounded-xl border border-border bg-background px-3 py-2"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-xl border border-border bg-background px-3 py-2"
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="rounded-xl border border-border bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Filter
        </button>

        <Link
          href="/admin/candidates"
          className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
        >
          Clear
        </Link>
      </form>

      {/* Results */}
      {candidates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No candidates found. Run the keyword scanner on a source snapshot to
            generate candidates.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {candidates.length} candidate{candidates.length !== 1 ? "s" : ""}{" "}
            {category ? `in category "${category}"` : ""}{" "}
            {status ? `with status "${status}"` : ""}
          </p>

          {candidates.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <CardTitle className="text-sm font-semibold hover:underline">
                    <Link href={`/admin/candidates/${c.id}`}>
                      {c.headline}
                    </Link>
                  </CardTitle>
                  <StatusBadge value={c.status} />
                </div>
                <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-medium text-white capitalize">
                    {c.category}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {c.platform_name}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">
                    {c.source_title}
                  </span>
                  {c.source_snapshot_id && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <Link
                        href={`/admin/sources/${c.source_id}/snapshots/${c.source_snapshot_id}/scan`}
                        className="text-xs hover:underline"
                      >
                        View scan
                      </Link>
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
                  {c.excerpt}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {c.matched_keywords.map((kw) => (
                    <span
                      key={kw}
                      className="rounded-full border border-border/50 bg-muted/30 px-2 py-0.5 text-xs"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Created {formatDateTime(c.created_at)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
