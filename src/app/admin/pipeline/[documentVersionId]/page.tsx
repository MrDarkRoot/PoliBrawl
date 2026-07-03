import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/format";
import { getDocumentPipelineByVersionId } from "@/server/repositories/pipeline-repository";
import { buildPipelineDiagnostics } from "@/server/services/quality/pipeline-diagnostics";

export default async function PipelineInspectorPage({
  params,
  searchParams,
}: {
  params: Promise<{ documentVersionId: string }>;
  searchParams?: Promise<{ q?: string }>;
}) {
  const { documentVersionId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const data = await getDocumentPipelineByVersionId(documentVersionId, {
    clauseSearch: resolvedSearchParams.q,
  }).catch(() => null);

  if (!data) {
    notFound();
  }

  const diagnostics = buildPipelineDiagnostics({
    rawCandidateCount:
      Number(data.latestDiscoveryRun?.metadata?.rawCandidateCount ?? 0) || null,
    filteredCounts:
      (data.latestDiscoveryRun?.metadata?.filteredCounts as
        | Partial<Record<"keep" | "maybe" | "drop", number>>
        | undefined) ?? null,
    extractionConfidence: data.version.extraction_confidence,
    plainTextLength: data.version.plain_text?.length ?? 0,
    sections: data.sections,
    clauses: data.clauses,
    signalCandidates: data.signalCandidates,
    source: data.source,
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Pipeline Inspector"
        title={`Version ${data.version.version_number}`}
        description={`Document version ${data.version.id}`}
      />
      <Card>
        <CardHeader>
          <CardTitle>1. Source metadata</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          <p>Platform: {data.platform?.name ?? "Unknown"}</p>
          <p>Source title: {data.source?.title ?? "Untitled"}</p>
          <p>Source URL: {data.source?.url}</p>
          <p>Document type: {data.source?.document_type}</p>
          <p>Tier: {data.source?.source_tier}</p>
          <p>Current hash: {data.source?.current_hash ?? "Not set"}</p>
          <p>Version number: {data.version.version_number}</p>
          <p>Fetched at: {formatDateTime(data.version.fetched_at)}</p>
          <p>Extraction method: {data.version.extraction_method ?? "Unknown"}</p>
          <p>Extraction confidence: {data.version.extraction_confidence ?? "-"}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>2. Fetch information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>Latest fetch log: {data.latestFetchLog?.id ?? "None"}</p>
          <p>HTTP status: {data.latestFetchLog?.http_status ?? "n/a"}</p>
          <p>Final URL: {data.latestFetchLog?.final_url ?? "n/a"}</p>
          <p>Content type: {data.latestFetchLog?.content_type ?? "n/a"}</p>
          <p>Response size: {data.latestFetchLog?.response_size ?? "n/a"}</p>
          <p>Error: {data.latestFetchLog?.error_message ?? "None"}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>3. Extracted content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <p>Raw HTML storage key: {data.version.raw_html_storage_key ?? "Not stored"}</p>
            <p>Plain text length: {data.version.plain_text?.length ?? 0}</p>
            <p>Markdown length: {data.version.markdown_text?.length ?? 0}</p>
            <p>Heading count: {data.sections.filter((section) => section.heading).length}</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-2xl border border-border/70 bg-zinc-50 p-4 text-sm">
              {data.version.markdown_text ?? "No markdown text stored."}
            </pre>
            <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-2xl border border-border/70 bg-zinc-50 p-4 text-sm">
              {data.version.plain_text ?? "No plain text stored."}
            </pre>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>4. Sections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Section count: {data.sections.length}
          </p>
          {data.sections.map((section) => (
            <div key={section.id} className="rounded-2xl border border-border/70 p-4">
              <p className="font-medium">{section.heading ?? "Untitled section"}</p>
              <p className="mt-2 line-clamp-5 whitespace-pre-wrap text-sm text-muted-foreground">
                {section.section_text ?? ""}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>5. Clauses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="flex gap-3" method="get">
            <Input
              name="q"
              defaultValue={resolvedSearchParams.q ?? ""}
              placeholder="Search clauses"
            />
            <button className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-medium">
              Filter
            </button>
          </form>
          <p className="text-sm text-muted-foreground">
            Showing {Math.min(data.clauses.length, 50)} of {data.totalClauseCount} clauses
          </p>
          {data.clauses.slice(0, 50).map((clause) => (
            <div key={clause.id} className="rounded-2xl border border-border/70 p-4 text-sm">
              <div className="flex flex-wrap gap-4">
                <p>Order: {clause.clause_order}</p>
                <p>Hash: {clause.clause_hash ?? "n/a"}</p>
                <p>Word count: {clause.word_count ?? 0}</p>
              </div>
              <p className="mt-3 whitespace-pre-wrap">{clause.clause_text}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>6. Signal candidates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.signalCandidates.map((candidate) => (
            <div key={candidate.id} className="rounded-2xl border border-border/70 p-4 text-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-medium">{candidate.suggested_signal}</p>
                  <p className="text-muted-foreground">
                    {candidate.signal_rules?.rule_name ?? "No rule"} ·{" "}
                    {candidate.suggested_category} · {candidate.suggested_level}
                  </p>
                </div>
                <StatusBadge value={candidate.status} />
              </div>
              <p className="mt-2">Confidence: {candidate.confidence ?? "-"}</p>
              <p className="mt-1">
                Matched terms:{" "}
                {Array.isArray(candidate.matched_terms)
                  ? candidate.matched_terms.join(", ")
                  : "None"}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>7. Approved signals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.approvedSignals.map((signal) => (
            <div key={signal.id} className="rounded-2xl border border-border/70 p-4 text-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{signal.name}</p>
                  <p className="text-muted-foreground">
                    {signal.category} · {signal.level} · confidence {signal.confidence}
                  </p>
                </div>
                <StatusBadge value={signal.status} />
              </div>
              <p className="mt-3 whitespace-pre-wrap">{signal.explanation ?? "No explanation."}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>8. Evidence items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.evidenceItems.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border/70 p-4 text-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{item.document_title ?? "Evidence item"}</p>
                  <p className="text-muted-foreground">{item.source_url}</p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge value={item.status} />
                  <Badge variant="outline">{item.visibility}</Badge>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap">{item.clause_excerpt}</p>
              <p className="mt-3 whitespace-pre-wrap text-muted-foreground">{item.explanation}</p>
              <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                {item.why_it_matters ?? "No why-it-matters note."}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>9. Data quality diagnostics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {diagnostics.map((diagnostic) => (
            <div key={diagnostic.code} className="rounded-2xl border border-border/70 p-4">
              <div className="flex items-center gap-2">
                <StatusBadge value={diagnostic.level} />
                <p className="font-medium">{diagnostic.code}</p>
              </div>
              <p className="mt-2 text-muted-foreground">{diagnostic.message}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
