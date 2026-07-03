import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, FlaskConical } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CopyButton } from "@/features/research-packets/components/copy-button";
import {
  findResearchPacketWithEvidence,
} from "@/server/polibrawl/repositories/research-packet.repository";
import {
  exportPacketAsMarkdown,
  buildAiPromptTemplate,
} from "@/server/polibrawl/services/research-packet-builder.service";
import { formatDateTime } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const packet = await findResearchPacketWithEvidence(id).catch(() => null);
  return {
    title: packet
      ? `${packet.platform_name ?? "Unknown"} — ${packet.title} — Research Packet`
      : "Research Packet — PoliBrawl Admin",
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  money: "bg-amber-100 text-amber-900",
  account: "bg-rose-100 text-rose-900",
  kyc: "bg-sky-100 text-sky-900",
  payout: "bg-indigo-100 text-indigo-900",
  appeal: "bg-orange-100 text-orange-900",
  data_saas: "bg-emerald-100 text-emerald-900",
  api: "bg-violet-100 text-violet-900",
  legal: "bg-zinc-100 text-zinc-900",
};

export default async function ResearchPacketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const packet = await findResearchPacketWithEvidence(id).catch(() => null);
  if (!packet) notFound();

  const markdown = exportPacketAsMarkdown(packet);
  const prompt = buildAiPromptTemplate(packet);
  const highConfidenceEvidence = packet.evidence.filter((e) => e.confidence_score >= 40);
  const noisyEvidence = packet.evidence.filter((e) => e.noise_score >= 30);

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/admin/research-packets"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Research Packets
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          eyebrow={`${packet.platform_name ?? "Platform"} · ${packet.category}`}
          title={packet.title}
          description={packet.summary ?? undefined}
        />
        <StatusBadge value={packet.status} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        {/* Main content */}
        <div className="space-y-6">

          {/* Scores + meta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4" />
                Packet Scores
              </CardTitle>
              <CardDescription>
                Deterministic scores computed from scanner heuristics. No AI.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Confidence Score</p>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-3xl font-bold tabular-nums ${
                      packet.confidence_score >= 60
                        ? "text-emerald-700"
                        : packet.confidence_score >= 30
                          ? "text-amber-700"
                          : "text-rose-700"
                    }`}
                  >
                    {packet.confidence_score}
                  </span>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Noise Score</p>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-3xl font-bold tabular-nums ${
                      packet.noise_score >= 40
                        ? "text-rose-700"
                        : packet.noise_score >= 20
                          ? "text-amber-700"
                          : "text-emerald-700"
                    }`}
                  >
                    {packet.noise_score}
                  </span>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Evidence Items</p>
                <div className="text-3xl font-bold tabular-nums">{packet.evidence.length}</div>
                <p className="text-xs text-muted-foreground">
                  {highConfidenceEvidence.length} high-confidence
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Suggested editorial fields */}
          <Card>
            <CardHeader>
              <CardTitle>Suggested Editorial Fields</CardTitle>
              <CardDescription>
                Generated by scanner heuristics — edit before publishing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Suggested Level</p>
                  <Badge variant="outline">{packet.suggested_level ?? "medium"}</Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Category</p>
                  <Badge className={CATEGORY_COLORS[packet.category] ?? "bg-zinc-100 text-zinc-900"}>
                    {packet.category}
                  </Badge>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Suggested Risk Description</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {packet.suggested_risk ?? "—"}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Keywords Found</p>
                <div className="flex flex-wrap gap-1.5">
                  {packet.keywords_found.map((kw) => (
                    <code
                      key={kw}
                      className="rounded bg-zinc-900 px-2 py-0.5 text-xs text-white"
                    >
                      {kw}
                    </code>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Evidence items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Evidence Excerpts</CardTitle>
                  <CardDescription>
                    Ranked by confidence score. High-noise excerpts may be footer or navigation text.
                  </CardDescription>
                </div>
                {packet.source_url && (
                  <a
                    href={packet.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground underline truncate max-w-[200px]"
                  >
                    Source ↗
                  </a>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {packet.evidence.length === 0 ? (
                <p className="text-sm text-muted-foreground">No evidence items generated.</p>
              ) : (
                packet.evidence.map((ev, idx) => (
                  <div key={ev.id} className="rounded-lg border overflow-hidden">
                    <div className="flex items-center justify-between bg-muted/40 px-4 py-2 text-xs">
                      <span className="font-semibold text-muted-foreground">
                        Evidence #{idx + 1}
                        {ev.section_hint ? ` — ${ev.section_hint}` : ""}
                      </span>
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-mono font-bold ${
                            ev.confidence_score >= 60
                              ? "text-emerald-700"
                              : ev.confidence_score >= 30
                                ? "text-amber-700"
                                : "text-rose-600"
                          }`}
                        >
                          ↑ {ev.confidence_score}
                        </span>
                        {ev.noise_score >= 30 && (
                          <span className="text-rose-600 font-mono">⚠ noise {ev.noise_score}</span>
                        )}
                      </div>
                    </div>
                    {ev.context_before && (
                      <p className="px-4 pt-3 text-xs text-muted-foreground italic">
                        …{ev.context_before}
                      </p>
                    )}
                    <blockquote className="px-4 py-3 text-sm leading-relaxed border-l-4 border-primary/40 bg-background">
                      {ev.excerpt}
                    </blockquote>
                    {ev.context_after && (
                      <p className="px-4 pb-3 text-xs text-muted-foreground italic">
                        {ev.context_after}…
                      </p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Scanner observations */}
          <Card>
            <CardHeader>
              <CardTitle>Scanner Observations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {packet.scanner_observations ?? "None recorded."}
              </p>
              {packet.possible_false_positives && (
                <>
                  <Separator />
                  <div className="flex gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-xs font-semibold text-amber-900 mb-1">
                        Possible False Positives
                      </p>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        {packet.possible_false_positives}
                      </p>
                    </div>
                  </div>
                </>
              )}
              {noisyEvidence.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {noisyEvidence.length} evidence item(s) have elevated noise scores
                  (≥30). Review carefully before approving.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Candidate link */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Linked Candidate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium truncate">
                {packet.candidate_headline ?? "Candidate"}
              </p>
              <p className="text-xs text-muted-foreground">
                Status: <StatusBadge value={packet.candidate_status ?? "pending"} />
              </p>
              <Link
                href={`/admin/candidates/${packet.candidate_id}`}
                className="block mt-2 text-xs text-primary hover:underline"
              >
                Open Candidate →
              </Link>
            </CardContent>
          </Card>

          {/* Meta */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Packet Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Generated</span>
                <span className="text-foreground">{formatDateTime(packet.generated_at)}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform</span>
                <span className="text-foreground">{packet.platform_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Category</span>
                <span className="text-foreground">{packet.category}</span>
              </div>
              {packet.source_url && (
                <div className="flex justify-between gap-2">
                  <span>Source URL</span>
                  <a
                    href={packet.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate max-w-[160px]"
                  >
                    View ↗
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export tools */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Export & AI Tools</CardTitle>
              <CardDescription className="text-xs">
                Use these to feed the packet into ChatGPT or Claude for editorial assistance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  Export as Markdown
                </p>
                <CopyButton text={markdown} label="Copy Markdown" />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Full packet with all evidence and context.
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  AI Prompt Template
                </p>
                <CopyButton text={prompt} label="Copy Prompt" />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Pre-filled prompt for ChatGPT / Claude. Paste the full Markdown first, then this prompt.
                </p>
              </div>
              <Separator />
              <div className="rounded-md bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">How to use:</p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Copy Markdown → Paste into ChatGPT/Claude</li>
                  <li>Copy Prompt → Paste after the markdown</li>
                  <li>Review AI output carefully before using</li>
                  <li>Humans must verify all evidence claims</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Suggested checklist */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Suggested Editorial Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex gap-2">
                  <span>□</span>
                  Verify evidence excerpts against the original source
                </li>
                <li className="flex gap-2">
                  <span>□</span>
                  Confirm no noisy or navigation-based excerpts were included
                </li>
                <li className="flex gap-2">
                  <span>□</span>
                  Review AI output before copying to Red Flag editor
                </li>
                <li className="flex gap-2">
                  <span>□</span>
                  Ensure wording is neutral and evidence-backed
                </li>
                <li className="flex gap-2">
                  <span>□</span>
                  Add a survival note and backup option before publishing
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Suggested backup option */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Suggested Backup Option Prompt</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>
                Consider research into alternative payment platforms or operational safeguards relevant to this{" "}
                <strong>{packet.category}</strong> risk.
              </p>
              <p>
                Include tradeoffs: fees, onboarding time, feature parity, geographic availability.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
