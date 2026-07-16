import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileWarning, Sparkles, Target, AlertTriangle, CheckCircle, XCircle, BarChart3 } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  formatBackupOptionsForTextarea,
  formatLinesForTextarea,
} from "@/features/editorial-drafts/editorial-draft-formats";
import { updateEditorialDraftAction } from "@/features/editorial-drafts/actions/editorial-draft.actions";
import { requireAdminAccess } from "@/lib/auth";
import {
  findEditorialDraftWithContext,
} from "@/server/polibrawl/repositories/editorial-draft.repository";
import {
  listResearchPacketEvidenceByIds,
} from "@/server/polibrawl/repositories/research-packet.repository";
import {
  listEditorialDraftRevisions,
} from "@/server/polibrawl/repositories/editorial-draft-revision.repository";

// ─── Critic Result Display Helpers ─────────────────────────────────────────────

type CriticIssue = {
  code: string;
  severity: "blocker" | "high" | "medium" | "low";
  field: string;
  message: string;
};

type QualityComponents = {
  evidence_grounding?: number;
  platform_specificity?: number;
  affected_user_clarity?: number;
  operational_impact?: number;
  actionability?: number;
  backup_quality?: number;
  uncertainty_handling?: number;
};

type QualityEvaluation = {
  totalScore?: number;
  components?: QualityComponents;
  deductions?: Array<{ reason: string; points: number }>;
  summary?: string;
};

type CriticResult = {
  approved?: boolean;
  score?: number;
  issues?: CriticIssue[];
  requiredRevisions?: string[];
  evidenceCoverage?: { supportedClaims: number; unsupportedClaims: number };
};

function safeParseCriticResult(raw: Record<string, unknown> | null): CriticResult | null {
  if (!raw) return null;
  return raw as CriticResult;
}

function safeParseQualityEvaluation(raw: Record<string, unknown> | null): QualityEvaluation | null {
  if (!raw) return null;
  return raw as QualityEvaluation;
}

function severityColor(severity: string): string {
  switch (severity) {
    case "blocker": return "text-red-700 bg-red-50 border-red-200";
    case "high": return "text-orange-700 bg-orange-50 border-orange-200";
    case "medium": return "text-yellow-700 bg-yellow-50 border-yellow-200";
    default: return "text-muted-foreground bg-muted border-border";
  }
}

function scoreBadgeColor(score: number): string {
  if (score >= 80) return "text-green-700 bg-green-50";
  if (score >= 60) return "text-yellow-700 bg-yellow-50";
  if (score >= 40) return "text-orange-700 bg-orange-50";
  return "text-red-700 bg-red-50";
}

export default async function EditorialDraftDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminAccess();

  const { id } = await params;
  const draft = await findEditorialDraftWithContext(id).catch(() => null);

  if (!draft) {
    notFound();
  }

  const [evidenceItems, revisions] = await Promise.all([
    listResearchPacketEvidenceByIds(
      draft.research_packet_id,
      draft.evidence_reference_ids,
    ).catch(() => []),
    listEditorialDraftRevisions(id).catch(() => []),
  ]);

  const criticResult = safeParseCriticResult(draft.critic_result);
  const qualityEvaluation = safeParseQualityEvaluation(draft.quality_evaluation);
  const generationContext = draft.generation_context;

  const hasCalibrationData = !!(criticResult || qualityEvaluation);
  const hasBlockers = criticResult?.issues?.some((i) => i.severity === "blocker") ?? false;
  const aiRevision = revisions.find((r) => r.revision_type === "ai_generated");

  return (
    <div className="space-y-8">
      <Link
        href="/admin/editorial-drafts"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Editorial Drafts
      </Link>

      <PageHeader
        eyebrow={`AI Editorial Worker · ${draft.platform_name}${draft.template_key ? ` · ${draft.template_key}` : ""}`}
        title={draft.title}
        description="This draft is internal-only. Human review is required before any approval or publish state."
        actions={<StatusBadge value={draft.status} />}
      />

      {/* Publication blockers banner */}
      {hasBlockers && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
          <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
          <div className="text-sm text-red-700">
            <strong>Publication blocked.</strong> This draft has blocker-severity critic findings that must be resolved before it can be approved.
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <form
          action={updateEditorialDraftAction.bind(null, draft.id)}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Draft Content</CardTitle>
              <CardDescription>
                Edit the structured copy directly. Evidence references remain attached to the originating packet excerpts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" defaultValue={draft.title} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">What Is Happening?</Label>
                <Textarea
                  id="summary"
                  name="summary"
                  defaultValue={draft.summary}
                  required
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="who_is_affected">Who Is Affected?</Label>
                <Textarea
                  id="who_is_affected"
                  name="who_is_affected"
                  defaultValue={formatLinesForTextarea(draft.who_is_affected)}
                  required
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="why_it_matters">Why Does This Matter?</Label>
                <Textarea
                  id="why_it_matters"
                  name="why_it_matters"
                  defaultValue={draft.why_it_matters}
                  required
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="survival_actions">Survival Playbook</Label>
                <Textarea
                  id="survival_actions"
                  name="survival_actions"
                  defaultValue={formatLinesForTextarea(draft.survival_actions)}
                  required
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="checklist_items">Checklist</Label>
                <Textarea
                  id="checklist_items"
                  name="checklist_items"
                  defaultValue={formatLinesForTextarea(draft.checklist_items)}
                  required
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="backup_options">Backup Options</Label>
                <Textarea
                  id="backup_options"
                  name="backup_options"
                  defaultValue={formatBackupOptionsForTextarea(draft.backup_options)}
                  required
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  One option per line: <code>Label | Trade-off</code>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="evidence_summary">Evidence Summary</Label>
                <Textarea
                  id="evidence_summary"
                  name="evidence_summary"
                  defaultValue={draft.evidence_summary}
                  required
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai_confidence">AI Confidence</Label>
                <Input
                  id="ai_confidence"
                  name="ai_confidence"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={draft.ai_confidence}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Review Actions</CardTitle>
              <CardDescription>
                Drafts never become public automatically. Publishing is blocked until the draft is approved.
                {hasBlockers ? " Approval is blocked by critic findings above." : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <button className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground" type="submit" name="intent" value="save">
                Save
              </button>
              <button className="inline-flex h-8 items-center rounded-lg border border-input px-3 text-sm font-medium" type="submit" name="intent" value="review_requested">
                Request Review
              </button>
              <button className="inline-flex h-8 items-center rounded-lg border border-input px-3 text-sm font-medium" type="submit" name="intent" value="approved">
                Approve
              </button>
              <button className="inline-flex h-8 items-center rounded-lg border border-input px-3 text-sm font-medium" type="submit" name="intent" value="rejected">
                Reject
              </button>
              <button className="inline-flex h-8 items-center rounded-lg border border-input px-3 text-sm font-medium" type="submit" name="intent" value="published">
                Publish
              </button>
            </CardContent>
          </Card>
        </form>

        <div className="space-y-4">
          {/* Draft Context */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4" />
                Draft Context
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Platform:</span> {draft.platform_name}
              </p>
              <p>
                <span className="font-medium">Draft type:</span>{" "}
                {draft.draft_type.replaceAll("_", " ")}
              </p>
              {draft.template_key ? (
                <p>
                  <span className="font-medium">Category template:</span>{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">{draft.template_key}</code>
                </p>
              ) : null}
              <p>
                <span className="font-medium">Research packet:</span>{" "}
                <Link
                  href={`/admin/research-packets/${draft.research_packet_id}`}
                  className="text-primary hover:underline"
                >
                  {draft.research_packet_title}
                </Link>
              </p>
              <p>
                <span className="font-medium">Packet status:</span> {draft.research_packet_status}
              </p>
              {draft.red_flag_title ? (
                <p>
                  <span className="font-medium">Linked red flag:</span> {draft.red_flag_title}
                </p>
              ) : null}
              <p>
                <span className="font-medium">Created:</span>{" "}
                {new Date(draft.created_at).toLocaleString()}
              </p>
              <p>
                <span className="font-medium">Updated:</span>{" "}
                {new Date(draft.updated_at).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          {/* Quality Score Breakdown — Sprint 10.5 */}
          {qualityEvaluation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <BarChart3 className="h-4 w-4" />
                  Quality Score Breakdown
                </CardTitle>
                <CardDescription>
                  Internal calibration score. Not shown publicly.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {typeof qualityEvaluation.totalScore === "number" && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Score</span>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${scoreBadgeColor(qualityEvaluation.totalScore)}`}>
                      {qualityEvaluation.totalScore} / 100
                    </span>
                  </div>
                )}
                {qualityEvaluation.summary && (
                  <p className="text-xs text-muted-foreground">{qualityEvaluation.summary}</p>
                )}
                {qualityEvaluation.components && (
                  <div className="space-y-1.5">
                    {Object.entries(qualityEvaluation.components).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                        <span className="font-medium tabular-nums">{value as number}</span>
                      </div>
                    ))}
                  </div>
                )}
                {qualityEvaluation.deductions && qualityEvaluation.deductions.length > 0 && (
                  <div className="border-t pt-2 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Deductions</p>
                    {qualityEvaluation.deductions.map((d, i) => (
                      <div key={i} className="text-xs text-muted-foreground flex justify-between gap-2">
                        <span className="flex-1">{d.reason}</span>
                        <span className="text-red-600 shrink-0">−{d.points}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Critic Findings — Sprint 10.5 */}
          {criticResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4" />
                  Critic Findings
                  {typeof criticResult.score === "number" && (
                    <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-md ${scoreBadgeColor(criticResult.score)}`}>
                      {criticResult.score}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {criticResult.approved
                    ? "Critic approved — no blockers or high-severity issues."
                    : "Critic found issues. Review required revisions before approving."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {criticResult.evidenceCoverage && (
                  <div className="text-xs text-muted-foreground flex gap-4">
                    <span>Evidence coverage: {criticResult.evidenceCoverage.supportedClaims} supported · {criticResult.evidenceCoverage.unsupportedClaims} flagged</span>
                  </div>
                )}

                {criticResult.requiredRevisions && criticResult.requiredRevisions.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium">Required revisions</p>
                    {criticResult.requiredRevisions.map((rev, i) => (
                      <div key={i} className="text-xs text-orange-700 bg-orange-50 border border-orange-100 rounded px-2 py-1.5">
                        {rev}
                      </div>
                    ))}
                  </div>
                )}

                {criticResult.issues && criticResult.issues.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium">All findings</p>
                    {criticResult.issues.map((issue, i) => (
                      <div key={i} className={`text-xs border rounded px-2 py-1.5 ${severityColor(issue.severity)}`}>
                        <div className="flex items-center justify-between mb-0.5">
                          <code className="text-xs opacity-75">{issue.code}</code>
                          <span className="text-xs font-medium uppercase">{issue.severity}</span>
                        </div>
                        <p>{issue.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {criticResult.approved && (
                  <div className="flex items-center gap-2 text-green-700 text-xs bg-green-50 border border-green-200 rounded px-2 py-1.5">
                    <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>No blockers or high-severity issues. Human approval still required.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Generation Context — Sprint 10.5 */}
          {generationContext && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  Generation Context
                </CardTitle>
                <CardDescription>Evidence coverage and enrichment metadata.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                {typeof generationContext.evidenceStrength === "string" && (
                  <p><span className="font-medium text-foreground">Evidence strength:</span> {generationContext.evidenceStrength}</p>
                )}
                {typeof generationContext.totalEvidenceItems === "number" && (
                  <p><span className="font-medium text-foreground">Evidence items:</span> {generationContext.totalEvidenceItems}</p>
                )}
                {typeof generationContext.categoryTemplateKey === "string" && (
                  <p><span className="font-medium text-foreground">Template:</span> <code>{generationContext.categoryTemplateKey}</code></p>
                )}
                {typeof generationContext.categoryTemplateIsExactMatch === "boolean" && (
                  <p><span className="font-medium text-foreground">Exact category match:</span> {generationContext.categoryTemplateIsExactMatch ? "Yes" : "No (mapped)"}</p>
                )}
                {Array.isArray(generationContext.evidenceLimitations) && generationContext.evidenceLimitations.length > 0 && (
                  <div>
                    <p className="font-medium text-foreground mb-1">Evidence limitations</p>
                    {(generationContext.evidenceLimitations as string[]).map((lim, i) => (
                      <p key={i} className="ml-2 mb-0.5">· {lim}</p>
                    ))}
                  </div>
                )}
                {Array.isArray(generationContext.unsupportedInferences) && generationContext.unsupportedInferences.length > 0 && (
                  <div>
                    <p className="font-medium text-foreground mb-1">Unsupported inferences</p>
                    {(generationContext.unsupportedInferences as string[]).map((inf, i) => (
                      <p key={i} className="ml-2 mb-0.5 text-red-700">· {inf}</p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Revision History — Sprint 10.5 */}
          {revisions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Revision History</CardTitle>
                <CardDescription>
                  Edit-distance tracking across revision types.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {revisions.map((rev) => (
                  <div key={rev.id} className="flex items-center justify-between text-xs border rounded px-2 py-1.5">
                    <div>
                      <span className="font-medium capitalize">{rev.revision_type.replace(/_/g, " ")}</span>
                      <span className="ml-2 text-muted-foreground">{rev.actor_type}</span>
                    </div>
                    <div className="text-right text-muted-foreground">
                      {typeof rev.edit_distance_ratio === "number" && (
                        <span className="mr-3">
                          {(rev.edit_distance_ratio * 100).toFixed(1)}% changed
                        </span>
                      )}
                      <span>{new Date(rev.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Evidence References */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileWarning className="h-4 w-4" />
                Evidence References
              </CardTitle>
              <CardDescription>
                Selected packet excerpts preserved for editorial review.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {evidenceItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No evidence excerpts are attached to this draft.
                </p>
              ) : (
                evidenceItems.map((evidence, index) => (
                  <div key={evidence.id} className="rounded-lg border p-3">
                    <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        Evidence #{index + 1}
                        {evidence.section_hint ? ` · ${evidence.section_hint}` : ""}
                      </span>
                      <span>
                        conf {evidence.confidence_score} · noise {evidence.noise_score}
                      </span>
                    </div>
                    <p className="text-sm leading-6">{evidence.excerpt}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Baseline hint for pre-calibration drafts */}
          {!hasCalibrationData && (
            <Card>
              <CardContent className="py-4">
                <p className="text-xs text-muted-foreground">
                  This draft was generated before Sprint 10.5 calibration. Quality scores and critic results are only available for drafts generated with the calibrated workflow.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
