import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function getDocumentPipelineByVersionId(
  versionId: string,
  options?: { clauseSearch?: string },
) {
  const supabase = createAdminSupabaseClient();
  const { data: version, error: versionError } = await supabase
    .from("document_versions")
    .select("*, policy_sources(*, platforms(*))")
    .eq("id", versionId)
    .single();

  if (versionError) {
    throw versionError;
  }

  const sourceId = version.policy_source_id;

  const [
    { data: fetchLogs, error: fetchError },
    { data: sections, error: sectionsError },
    { data: clauses, error: clausesError },
    { data: discoveryRuns, error: discoveryRunsError },
  ] = await Promise.all([
    supabase
      .from("fetch_logs")
      .select("*")
      .eq("policy_source_id", sourceId)
      .order("fetched_at", { ascending: false })
      .limit(10),
    supabase
      .from("sections")
      .select("*")
      .eq("document_version_id", versionId)
      .order("section_order", { ascending: true }),
    supabase
      .from("clauses")
      .select("*")
      .eq("document_version_id", versionId)
      .order("clause_order", { ascending: true }),
    supabase
      .from("discovery_runs")
      .select("*")
      .eq("platform_id", version.policy_sources?.platform_id)
      .order("started_at", { ascending: false })
      .limit(1),
  ]);

  if (fetchError) {
    throw fetchError;
  }

  if (sectionsError) {
    throw sectionsError;
  }

  if (clausesError) {
    throw clausesError;
  }

  if (discoveryRunsError) {
    throw discoveryRunsError;
  }

  const filteredClauses = options?.clauseSearch
    ? (clauses ?? []).filter((clause) =>
        clause.clause_text
          .toLowerCase()
          .includes(options.clauseSearch?.toLowerCase() ?? ""),
      )
    : clauses ?? [];

  const clauseIds = (clauses ?? []).map((clause) => clause.id);

  const { data: signalCandidates, error: signalCandidatesError } = clauseIds.length
    ? await supabase
        .from("signal_candidates")
        .select("*, signal_rules(rule_name)")
        .in("clause_id", clauseIds)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (signalCandidatesError) {
    throw signalCandidatesError;
  }

  const { data: evidenceItems, error: evidenceError } = await supabase
    .from("evidence_items")
    .select("*")
    .or(`document_version_id.eq.${versionId},policy_source_id.eq.${sourceId}`)
    .order("created_at", { ascending: false });

  if (evidenceError) {
    throw evidenceError;
  }

  const signalIds = Array.from(
    new Set((evidenceItems ?? []).map((item) => item.signal_id).filter(Boolean)),
  );

  const { data: approvedSignals, error: approvedSignalsError } = signalIds.length
    ? await supabase.from("signals").select("*").in("id", signalIds).order("created_at", {
        ascending: false,
      })
    : { data: [], error: null };

  if (approvedSignalsError) {
    throw approvedSignalsError;
  }

  return {
    version,
    source: version.policy_sources,
    platform: version.policy_sources?.platforms ?? null,
    latestDiscoveryRun: discoveryRuns?.[0] ?? null,
    latestFetchLog: fetchLogs?.[0] ?? null,
    fetchLogs: fetchLogs ?? [],
    sections: sections ?? [],
    clauses: filteredClauses,
    totalClauseCount: clauses?.length ?? 0,
    signalCandidates: signalCandidates ?? [],
    approvedSignals: approvedSignals ?? [],
    evidenceItems: evidenceItems ?? [],
  };
}
