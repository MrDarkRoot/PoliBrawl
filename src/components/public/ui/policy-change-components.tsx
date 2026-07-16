import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  CheckCircle2,
  Clock3,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

import {
  addPlatformToWatchlistAction,
  markAllPolicyAlertsReadAction,
  markPolicyAlertReadAction,
  removePlatformFromWatchlistAction,
} from "@/features/policy-intelligence/actions/watchlist.actions";
import type {
  DashboardPolicyAlert,
  DashboardWatchlistPlatform,
} from "@/server/polibrawl/services/policy-intelligence.service";
import type {
  PublicPolicyChangeDetail,
  PublicPolicyChangeListItem,
} from "@/server/polibrawl/services/public-view-models.shared";

function impactTone(level: string) {
  if (level === "critical") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (level === "high") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (level === "medium") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Recent";
  }

  return new Date(value).toLocaleDateString();
}

export function PolicyChangeImpactBadge({ level }: { level: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black uppercase tracking-widest ${impactTone(level)}`}
    >
      {level} impact
    </span>
  );
}

export function WatchlistToggleForm({
  authState,
  isWatching,
  platformId,
  redirectTo,
}: {
  authState: "configured" | "anonymous" | "missing-env";
  isWatching: boolean;
  platformId: string;
  redirectTo: string;
}) {
  if (authState !== "configured") {
    return (
      <Link
        className="inline-flex items-center justify-center rounded-lg border-2 border-blue-200 bg-white px-5 py-2.5 font-bold text-blue-700 shadow-sm transition-colors hover:bg-blue-50"
        href={`/login?next=${encodeURIComponent(redirectTo)}`}
      >
        Watch Platform
      </Link>
    );
  }

  const action = isWatching
    ? removePlatformFromWatchlistAction
    : addPlatformToWatchlistAction;

  return (
    <form action={action}>
      <input name="platform_id" type="hidden" value={platformId} />
      <input name="redirect_to" type="hidden" value={redirectTo} />
      <button
        className={
          isWatching
            ? "inline-flex items-center justify-center rounded-lg border-2 border-slate-300 bg-slate-100 px-5 py-2.5 font-bold text-slate-800 shadow-sm transition-colors hover:bg-slate-200"
            : "inline-flex items-center justify-center rounded-lg border-2 border-blue-200 bg-white px-5 py-2.5 font-bold text-blue-700 shadow-sm transition-colors hover:bg-blue-50"
        }
        type="submit"
      >
        {isWatching ? "Following" : "Watch Platform"}
      </button>
    </form>
  );
}

export function PolicyChangeCard({
  change,
}: {
  change: PublicPolicyChangeListItem;
}) {
  return (
    <Link
      className="block rounded-2xl border-2 border-slate-200 bg-white p-8 transition-all hover:border-slate-900 hover:shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]"
      href={`/changes/${change.id}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <PolicyChangeImpactBadge level={change.impact_level} />
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">
              {change.platform_name}
            </span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            {change.summary}
          </h2>
        </div>

        <ArrowUpRight className="h-5 w-5 text-slate-400" />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-6 text-sm font-medium text-slate-500">
        <span className="inline-flex items-center gap-2">
          <Clock3 className="h-4 w-4" />
          Published {formatDate(change.published_at ?? change.reviewed_at)}
        </span>
        {change.source_title ? <span>{change.source_title}</span> : null}
      </div>
    </Link>
  );
}

export function PolicyChangeEvidenceCard({
  change,
}: {
  change: PublicPolicyChangeDetail;
}) {
  const oldDate = formatDate(change.old_snapshot_captured_at);
  const newDate = formatDate(change.new_snapshot_captured_at);

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-slate-500">
            Evidence
          </p>
          <h3 className="mt-3 text-2xl font-black text-slate-900">
            Official source comparison
          </h3>
        </div>

        {change.source_url ? (
          <a
            className="inline-flex items-center rounded-lg border-2 border-slate-900 bg-white px-4 py-2 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-100"
            href={change.source_url}
            rel="noreferrer noopener"
            target="_blank"
          >
            View official source
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        ) : null}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">
            Previous reference
          </p>
          <p className="mt-3 text-lg font-semibold text-slate-900">
            {change.old_snapshot_title || "Earlier official snapshot"}
          </p>
          <p className="mt-2 text-sm font-medium text-slate-600">{oldDate}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">
            Current reference
          </p>
          <p className="mt-3 text-lg font-semibold text-slate-900">
            {change.new_snapshot_title || "Current official snapshot"}
          </p>
          <p className="mt-2 text-sm font-medium text-slate-600">{newDate}</p>
        </div>
      </div>
    </div>
  );
}

export function DashboardWatchlistCard({
  platform,
}: {
  platform: DashboardWatchlistPlatform;
}) {
  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">
            Following since {formatDate(platform.followed_at)}
          </p>
          <h3 className="mt-3 text-2xl font-black text-slate-900">{platform.name}</h3>
          <p className="mt-3 max-w-xl text-base font-medium leading-relaxed text-slate-600">
            {platform.summary || "Operational dependency coverage is available on the platform guide."}
          </p>
        </div>

        <form action={removePlatformFromWatchlistAction}>
          <input name="platform_id" type="hidden" value={platform.platform_id} />
          <input name="redirect_to" type="hidden" value="/dashboard" />
          <button
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
            type="submit"
          >
            Remove
          </button>
        </form>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">
            Unread alerts
          </p>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {platform.unread_alert_count}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">
            Recent changes
          </p>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {platform.recent_change_count}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">
            Latest change
          </p>
          <p className="mt-2 text-lg font-black text-slate-900">
            {formatDate(platform.latest_change_at)}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Link
          className="inline-flex items-center rounded-lg border-2 border-slate-900 px-4 py-2 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-50"
          href={`/platforms/${platform.slug}`}
        >
          Open guide
        </Link>
        <Link
          className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
          href="/changes"
        >
          Review radar
        </Link>
      </div>
    </div>
  );
}

export function DashboardAlertList({
  alerts,
}: {
  alerts: DashboardPolicyAlert[];
}) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-8">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-slate-500" />
          <h3 className="text-2xl font-black text-slate-900">Risk Alerts</h3>
        </div>
        <p className="mt-4 text-lg font-medium text-slate-600">
          No unread platform alerts are waiting right now.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-slate-500" />
          <h3 className="text-2xl font-black text-slate-900">Risk Alerts</h3>
        </div>

        <form action={markAllPolicyAlertsReadAction}>
          <input name="redirect_to" type="hidden" value="/dashboard" />
          <button
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
            type="submit"
          >
            Mark all read
          </button>
        </form>
      </div>

      <div className="mt-8 space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.alert_id}
            className="rounded-xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <PolicyChangeImpactBadge level={alert.impact_level} />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                    {alert.platform_name}
                  </span>
                </div>
                <Link
                  className="text-xl font-black text-slate-900 hover:text-blue-700"
                  href={`/changes/${alert.id}`}
                >
                  {alert.summary}
                </Link>
              </div>

              <form action={markPolicyAlertReadAction}>
                <input name="alert_id" type="hidden" value={alert.alert_id} />
                <input name="redirect_to" type="hidden" value="/dashboard" />
                <button
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-white"
                  type="submit"
                >
                  Mark read
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardEmptyState() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center">
      <ShieldAlert className="mx-auto h-10 w-10 text-slate-400" />
      <h2 className="mt-5 text-3xl font-black text-slate-900">
        Start with the platforms you depend on
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-lg font-medium leading-relaxed text-slate-600">
        Follow the payment rails, payout platforms, and infrastructure providers that could interrupt operations if their policies change.
      </p>
      <div className="mt-8 flex justify-center">
        <Link
          className="inline-flex items-center rounded-lg border-2 border-slate-900 px-5 py-3 text-base font-bold text-slate-900 transition-colors hover:bg-slate-100"
          href="/platforms"
        >
          Browse platforms
          <ArrowUpRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export function PolicyChangeActionList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white p-8">
      <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">
        {title}
      </h3>
      <ul className="mt-5 space-y-4">
        {items.map((item, index) => (
          <li
            key={`${title}-${index}`}
            className="flex items-start gap-3 text-lg font-medium leading-relaxed text-slate-700"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
