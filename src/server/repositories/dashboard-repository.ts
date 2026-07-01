import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { DashboardMetrics } from "@/types/domain";

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = createAdminSupabaseClient();

  const [
    platforms,
    pendingCandidates,
    sources,
    versions,
    clauses,
    signalCandidates,
    approvedSignals,
    evidenceItems,
  ] = await Promise.all([
    supabase.from("platforms").select("*", { count: "exact", head: true }),
    supabase
      .from("source_candidates")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("policy_sources").select("*", { count: "exact", head: true }),
    supabase
      .from("document_versions")
      .select("*", { count: "exact", head: true }),
    supabase.from("clauses").select("*", { count: "exact", head: true }),
    supabase
      .from("signal_candidates")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("signals")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("evidence_items")
      .select("*", { count: "exact", head: true }),
  ]);

  return {
    platforms: platforms.count ?? 0,
    pendingCandidates: pendingCandidates.count ?? 0,
    sources: sources.count ?? 0,
    versions: versions.count ?? 0,
    clauses: clauses.count ?? 0,
    signalCandidates: signalCandidates.count ?? 0,
    approvedSignals: approvedSignals.count ?? 0,
    evidenceItems: evidenceItems.count ?? 0,
  };
}
