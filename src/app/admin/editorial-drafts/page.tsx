import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { requireAdminAccess } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { generatePaypalDemoEditorialDraftAction } from "@/features/editorial-drafts/actions/editorial-draft.actions";
import { listEditorialDraftsWithContext } from "@/server/polibrawl/repositories/editorial-draft.repository";
import { editorialDraftStatuses } from "@/types/polibrawl";

export default async function EditorialDraftsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminAccess();

  const resolvedSearchParams = await searchParams;
  const rawStatus =
    typeof resolvedSearchParams.status === "string"
      ? resolvedSearchParams.status
      : undefined;
  const status = editorialDraftStatuses.includes(
    rawStatus as (typeof editorialDraftStatuses)[number],
  )
    ? (rawStatus as (typeof editorialDraftStatuses)[number])
    : undefined;

  const drafts = await listEditorialDraftsWithContext(
    status ? { status } : {},
    { limit: 100 },
  ).catch(() => []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Sprint 10"
        title="AI Editorial Drafts"
        description="Review structured drafts generated from research packets. AI output stays internal until a human editor approves it."
        actions={
          <form action={generatePaypalDemoEditorialDraftAction}>
            <button className={cn(buttonVariants())} type="submit">
              Generate PayPal Demo Draft
            </button>
          </form>
        }
      />

      <form className="grid gap-4 rounded-2xl border border-border/70 p-4 md:grid-cols-[220px_auto]">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={status ?? ""}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
          >
            <option value="">All statuses</option>
            {editorialDraftStatuses.map((item) => (
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
            href="/admin/editorial-drafts"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Reset
          </Link>
        </div>
      </form>

      {drafts.length === 0 ? (
        <EmptyState
          title="No editorial drafts yet"
          description="Generate the PayPal demo draft or create a draft from a research packet to start the review flow."
        />
      ) : (
        <div className="grid gap-4">
          {drafts.map((draft) => (
            <Card key={draft.id}>
              <CardHeader className="gap-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <CardTitle className="text-lg">
                    <Link
                      href={`/admin/editorial-drafts/${draft.id}`}
                      className="hover:underline"
                    >
                      {draft.title}
                    </Link>
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <StatusBadge value={draft.status} />
                    <span className="text-xs text-muted-foreground">
                      AI confidence {draft.ai_confidence}/100
                    </span>
                  </div>
                </div>
                <CardDescription>
                  {draft.platform_name} · {draft.draft_type.replaceAll("_", " ")} · packet:{" "}
                  {draft.research_packet_title}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-6 text-muted-foreground">
                  {draft.summary}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>Updated {new Date(draft.updated_at).toLocaleString()}</span>
                  <Link
                    href={`/admin/research-packets/${draft.research_packet_id}`}
                    className="text-primary hover:underline"
                  >
                    Open research packet
                  </Link>
                  {draft.red_flag_title ? (
                    <span>Linked red flag: {draft.red_flag_title}</span>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
