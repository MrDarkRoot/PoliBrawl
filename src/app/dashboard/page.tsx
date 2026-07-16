import { Bell, Radar, ShieldAlert } from "lucide-react";
import { redirect } from "next/navigation";

import { PublicFooter, PublicNav } from "@/components/public/layout";
import {
  DashboardAlertList,
  DashboardEmptyState,
  DashboardWatchlistCard,
  PolicyChangeCard,
} from "@/components/public/ui/policy-change-components";
import { getAuthContext } from "@/lib/auth";
import {
  getDashboardPolicyAlerts,
  getDashboardRecentPolicyChanges,
  getDashboardWatchlistPlatforms,
  syncPolicyAlertsForUser,
} from "@/server/polibrawl/services/policy-intelligence.service";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard | PoliBrawl",
  description:
    "Follow your platforms, review recent policy changes, and track operational alerts in one place.",
};

export default async function DashboardPage() {
  const auth = await getAuthContext();

  if (auth.kind !== "configured") {
    redirect("/login?next=/dashboard");
  }

  await syncPolicyAlertsForUser(auth.user.id);

  const [watchlistPlatforms, recentChanges, alerts] = await Promise.all([
    getDashboardWatchlistPlatforms(auth.user.id),
    getDashboardRecentPolicyChanges(auth.user.id),
    getDashboardPolicyAlerts(auth.user.id),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      <PublicNav activePath="/dashboard" />

      <main
        className="mx-auto flex-1 w-full max-w-[90rem] px-4 py-16 lg:px-8"
        id="main-content"
      >
        <section className="border-b-2 border-slate-900 pb-12">
          <div className="max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-3 text-sm font-black uppercase tracking-widest text-blue-700">
              <ShieldAlert className="h-5 w-5" />
              Personal intelligence center
            </div>
            <h1 className="text-5xl font-black tracking-tight text-slate-900 sm:text-7xl">
              My platforms
            </h1>
            <p className="text-2xl font-medium leading-snug text-slate-600">
              Track the platforms your business depends on, review recent policy changes, and keep alerts in one operating view.
            </p>
          </div>
        </section>

        {watchlistPlatforms.length === 0 ? (
          <section className="pt-12">
            <DashboardEmptyState />
          </section>
        ) : (
          <div className="space-y-16 pt-12">
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-6 w-6 text-slate-500" />
                <h2 className="text-3xl font-black text-slate-900">My Platforms</h2>
              </div>
              <div className="grid gap-6">
                {watchlistPlatforms.map((platform) => (
                  <DashboardWatchlistCard
                    key={platform.platform_id}
                    platform={platform}
                  />
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <Bell className="h-6 w-6 text-slate-500" />
                <h2 className="text-3xl font-black text-slate-900">Risk Alerts</h2>
              </div>
              <DashboardAlertList alerts={alerts} />
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <Radar className="h-6 w-6 text-slate-500" />
                <h2 className="text-3xl font-black text-slate-900">Recent Changes</h2>
              </div>
              {recentChanges.length === 0 ? (
                <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-8 text-lg font-medium text-slate-600">
                  No published changes have been attached to your watchlist yet.
                </div>
              ) : (
                <div className="grid gap-6">
                  {recentChanges.map((change) => (
                    <PolicyChangeCard key={change.id} change={change} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
