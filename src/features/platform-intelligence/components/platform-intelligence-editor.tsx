import {
  archiveDependencyScoreAction,
  archiveEvidenceConfidenceAction,
  archiveResolutionRouteAction,
  archiveRiskTimelineAction,
  upsertDependencyScoreAction,
  upsertEvidenceConfidenceAction,
  upsertResolutionRouteAction,
  upsertRiskTimelineAction,
} from "@/features/platform-intelligence/actions/intelligence.actions";
import {
  formatDateTimeLocal,
  formatLinesForTextarea,
  formatTimelineEventsForTextarea,
} from "@/features/platform-intelligence/intelligence-formats";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  DependencyScore,
  EvidenceConfidence,
  Platform,
  ResolutionRoute,
  RiskTimeline,
} from "@/types/polibrawl";

const editableStatuses = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
] as const;

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-1">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function TextInput({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <input
        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        defaultValue={defaultValue ?? ""}
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
    </label>
  );
}

function TextareaInput({
  label,
  name,
  defaultValue,
  placeholder,
  rows = 4,
  required = false,
  helper,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  helper?: string;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <textarea
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        defaultValue={defaultValue ?? ""}
        name={name}
        placeholder={placeholder}
        required={required}
        rows={rows}
      />
      {helper ? <span className="text-xs text-muted-foreground">{helper}</span> : null}
    </label>
  );
}

function StatusSelect({
  defaultValue,
  name = "status",
}: {
  defaultValue?: string | null;
  name?: string;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-foreground">Status</span>
      <select
        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        defaultValue={defaultValue ?? "draft"}
        name={name}
      >
        {editableStatuses.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DependencyScoreCard({
  platform,
  record,
}: {
  platform: Platform;
  record?: DependencyScore;
}) {
  const action = upsertDependencyScoreAction.bind(null, platform.id, record?.id ?? null);
  const archiveAction = record
    ? archiveDependencyScoreAction.bind(null, platform.id, record.id)
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{record ? "Edit Estimate" : "Add Dependency Estimate"}</CardTitle>
        <CardDescription>
          Label this clearly as a PoliBrawl operational dependency estimate, not an objective fact.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <TextInput defaultValue={record ? String(record.score) : "70"} label="Score" name="score" required type="number" />
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-foreground">Risk Level</span>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                defaultValue={record?.risk_level ?? "high"}
                name="risk_level"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
                <option value="unknown">Unknown</option>
              </select>
            </label>
            <TextInput
              defaultValue={formatDateTimeLocal(record?.generated_at)}
              label="Generated At"
              name="generated_at"
              type="datetime-local"
            />
          </div>

          <TextareaInput
            defaultValue={formatLinesForTextarea(record?.factors)}
            helper="One factor per line."
            label="Factors"
            name="factors"
            placeholder={"Primary payout provider\nNo backup route detected\nRevenue concentration is high"}
            rows={5}
          />

          <TextareaInput
            defaultValue={record?.explanation}
            label="Explanation"
            name="explanation"
            placeholder="Explain why this estimate is high and how users should interpret it."
            required
            rows={4}
          />

          <StatusSelect defaultValue={record?.status} />
          <div className="pt-2">
            <Button type="submit">{record ? "Save Estimate" : "Create Estimate"}</Button>
          </div>
        </form>
        {archiveAction ? (
          <form action={archiveAction} className="pt-3">
            <Button type="submit" variant="outline">
              Archive
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ResolutionRouteCard({
  platform,
  record,
}: {
  platform: Platform;
  record?: ResolutionRoute;
}) {
  const action = upsertResolutionRouteAction.bind(null, platform.id, record?.id ?? null);
  const archiveAction = record
    ? archiveResolutionRouteAction.bind(null, platform.id, record.id)
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{record ? record.organization_name : "Add Resolution Route"}</CardTitle>
        <CardDescription>
          Use this only for official internal or external escalation routes. Phrase it as a possible route, not a guaranteed outcome.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4">
          <input name="display_order" type="hidden" value={record?.display_order ?? 0} />
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput defaultValue={record?.organization_name} label="Organization Name" name="organization_name" required />
            <TextInput defaultValue={record?.organization_type} label="Organization Type" name="organization_type" required />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <TextInput defaultValue={record?.country} label="Country" name="country" />
            <TextInput defaultValue={record?.jurisdiction} label="Jurisdiction" name="jurisdiction" />
          </div>

          <TextInput defaultValue={record?.official_url} label="Official URL" name="official_url" required type="url" />

          <div className="grid gap-4 md:grid-cols-2">
            <TextareaInput
              defaultValue={formatLinesForTextarea(record?.eligible_users)}
              helper="One user segment per line."
              label="Eligible Users"
              name="eligible_users"
              rows={4}
            />
            <TextareaInput
              defaultValue={formatLinesForTextarea(record?.eligible_disputes)}
              helper="One dispute type per line."
              label="Eligible Disputes"
              name="eligible_disputes"
              rows={4}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <TextareaInput
              defaultValue={formatLinesForTextarea(record?.requirements)}
              helper="One required document or preparation item per line."
              label="Requirements"
              name="requirements"
              rows={4}
            />
            <TextareaInput
              defaultValue={formatLinesForTextarea(record?.steps)}
              helper="One process step per line."
              label="Steps"
              name="steps"
              rows={4}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <TextInput defaultValue={record?.fees} label="Fees" name="fees" />
            <TextInput defaultValue={record?.limits} label="Limits" name="limits" />
            <TextInput defaultValue={record?.deadline} label="Deadline" name="deadline" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <TextInput defaultValue={record?.verification_source} label="Verification Source" name="verification_source" required />
            <TextInput
              defaultValue={formatDateTimeLocal(record?.last_verified_at)}
              label="Last Verified At"
              name="last_verified_at"
              type="datetime-local"
            />
          </div>

          <StatusSelect defaultValue={record?.status} />
          <div className="pt-2">
            <Button type="submit">{record ? "Save Route" : "Create Route"}</Button>
          </div>
        </form>
        {archiveAction ? (
          <form action={archiveAction} className="pt-3">
            <Button type="submit" variant="outline">
              Archive
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

function RiskTimelineCard({
  platform,
  record,
}: {
  platform: Platform;
  record?: RiskTimeline;
}) {
  const action = upsertRiskTimelineAction.bind(null, platform.id, record?.id ?? null);
  const archiveAction = record
    ? archiveRiskTimelineAction.bind(null, platform.id, record.id)
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{record ? record.title : "Add Risk Timeline"}</CardTitle>
        <CardDescription>
          Each line must follow `time label | what happens`. Avoid invented precision and keep every event anchored to official information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4">
          <input name="display_order" type="hidden" value={record?.display_order ?? 0} />
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput defaultValue={record?.title} label="Title" name="title" required />
            <StatusSelect defaultValue={record?.status} />
          </div>

          <TextareaInput
            defaultValue={formatTimelineEventsForTextarea(record?.events)}
            helper="Example: Hour 0 | Account limitation detected"
            label="Events"
            name="events"
            placeholder={"Hour 0 | Account limitation detected\nDay 1 | Payment access may be affected\nLater | Timeline varies depending on account circumstances"}
            required
            rows={6}
          />

          <TextareaInput
            defaultValue={record?.source}
            label="Official Source Reference"
            name="source"
            placeholder="Resolution center guidance, account limitations help article, or user agreement clause."
            required
            rows={3}
          />

          <div className="pt-2">
            <Button type="submit">{record ? "Save Timeline" : "Create Timeline"}</Button>
          </div>
        </form>
        {archiveAction ? (
          <form action={archiveAction} className="pt-3">
            <Button type="submit" variant="outline">
              Archive
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

function EvidenceConfidenceCard({
  platform,
  record,
}: {
  platform: Platform;
  record?: EvidenceConfidence;
}) {
  const action = upsertEvidenceConfidenceAction.bind(null, platform.id, record?.id ?? null);
  const archiveAction = record
    ? archiveEvidenceConfidenceAction.bind(null, platform.id, record.id)
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{record ? "Edit Confidence Meter" : "Add Confidence Meter"}</CardTitle>
        <CardDescription>
          Describe why the evidence is trustworthy without exposing internal scanner or pipeline details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <TextInput defaultValue={record ? String(record.score) : "80"} label="Score" name="score" required type="number" />
            <TextInput
              defaultValue={formatDateTimeLocal(record?.last_verified_at)}
              label="Last Verified At"
              name="last_verified_at"
              type="datetime-local"
            />
            <StatusSelect defaultValue={record?.status} />
          </div>

          <TextareaInput
            defaultValue={formatLinesForTextarea(record?.factors)}
            helper="One confidence factor per line."
            label="Factors"
            name="factors"
            placeholder={"Official agreement\nCurrent source\nMultiple references\nVerified date"}
            rows={4}
          />

          <div className="pt-2">
            <Button type="submit">{record ? "Save Confidence" : "Create Confidence"}</Button>
          </div>
        </form>
        {archiveAction ? (
          <form action={archiveAction} className="pt-3">
            <Button type="submit" variant="outline">
              Archive
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function PlatformIntelligenceEditor({
  platform,
  dependencyScores,
  evidenceConfidence,
  resolutionRoutes,
  riskTimelines,
}: {
  platform: Platform;
  dependencyScores: DependencyScore[];
  evidenceConfidence: EvidenceConfidence[];
  resolutionRoutes: ResolutionRoute[];
  riskTimelines: RiskTimeline[];
}) {
  return (
    <div className="space-y-10">
      <Card>
        <CardHeader>
          <CardTitle>Platform Survival Intelligence</CardTitle>
          <CardDescription>
            Manage the platform-level intelligence layer that sits above individual red flags on the public survival page.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-border/70 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Dependency Estimates</div>
            <div className="mt-2 text-3xl font-semibold">{dependencyScores.length}</div>
          </div>
          <div className="rounded-lg border border-border/70 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Timelines</div>
            <div className="mt-2 text-3xl font-semibold">{riskTimelines.length}</div>
          </div>
          <div className="rounded-lg border border-border/70 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Resolution Routes</div>
            <div className="mt-2 text-3xl font-semibold">{resolutionRoutes.length}</div>
          </div>
          <div className="rounded-lg border border-border/70 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Confidence Records</div>
            <div className="mt-2 text-3xl font-semibold">{evidenceConfidence.length}</div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <SectionHeader
          description="Operational dependency estimate shown on the platform page. This is editorial guidance, not an objective truth claim."
          title="Dependency Snapshot"
        />
        <div className="grid gap-6">
          {dependencyScores.map((record) => (
            <DependencyScoreCard key={record.id} platform={platform} record={record} />
          ))}
          <DependencyScoreCard platform={platform} />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          description="Verified sequence cards that translate abstract policy language into operational expectations."
          title="What Happens If"
        />
        <div className="grid gap-6">
          {riskTimelines.map((record) => (
            <RiskTimelineCard key={record.id} platform={platform} record={record} />
          ))}
          <RiskTimelineCard platform={platform} />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          description="Internal and external escalation paths that may be available after a user completes the immediate survival checklist."
          title="Where To Escalate"
        />
        <div className="grid gap-6">
          {resolutionRoutes.map((record) => (
            <ResolutionRouteCard key={record.id} platform={platform} record={record} />
          ))}
          <ResolutionRouteCard platform={platform} />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          description="Public-facing trust signal summarizing how fresh and well-supported the official evidence is."
          title="Evidence Confidence"
        />
        <div className="grid gap-6">
          {evidenceConfidence.map((record) => (
            <EvidenceConfidenceCard key={record.id} platform={platform} record={record} />
          ))}
          <EvidenceConfidenceCard platform={platform} />
        </div>
      </section>
    </div>
  );
}
