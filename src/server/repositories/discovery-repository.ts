import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { SourceCandidate } from "@/types/domain";

export async function createDiscoveryRun(input: {
  platformId: string;
  websiteUrl: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("discovery_runs")
    .insert({
      platform_id: input.platformId,
      website_url: input.websiteUrl,
      status: "running",
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function finalizeDiscoveryRun(
  id: string,
  input: {
    status: "completed" | "failed" | "partial";
    metadata?: Record<string, unknown>;
    errorMessage?: string | null;
  },
) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("discovery_runs")
    .update({
      status: input.status,
      completed_at: new Date().toISOString(),
      metadata: input.metadata ?? {},
      error_message: input.errorMessage ?? null,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function insertSourceCandidates(
  candidates: Array<{
    discovery_run_id: string;
    platform_id: string;
    url: string;
    title?: string | null;
    suggested_document_type?: string | null;
    suggested_tier?: string | null;
    confidence?: number | null;
    detection_reason?: string | null;
    status?: SourceCandidate["status"];
  }>,
) {
  if (!candidates.length) {
    return [];
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("source_candidates")
    .insert(candidates)
    .select("*");

  if (error) {
    throw error;
  }

  return data;
}

export async function listDiscoveryRunsForPlatform(platformId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("discovery_runs")
    .select("*")
    .eq("platform_id", platformId)
    .order("started_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function getDiscoveryRunById(id: string) {
  const supabase = createAdminSupabaseClient();
  const [{ data: run, error: runError }, { data: candidates, error: candidatesError }] =
    await Promise.all([
      supabase.from("discovery_runs").select("*").eq("id", id).single(),
      supabase
        .from("source_candidates")
        .select("*")
        .eq("discovery_run_id", id)
        .order("confidence", { ascending: false }),
    ]);

  if (runError) {
    throw runError;
  }

  if (candidatesError) {
    throw candidatesError;
  }

  return {
    run,
    candidates,
  };
}

export async function listSourceCandidates(filters?: {
  status?: string;
  platformId?: string;
}) {
  const supabase = createAdminSupabaseClient();
  let query = supabase
    .from("source_candidates")
    .select("*, platforms(name, slug)")
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.platformId) {
    query = query.eq("platform_id", filters.platformId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
}

export async function getSourceCandidateById(id: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("source_candidates")
    .select("*, platforms(*), discovery_runs(*)")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateSourceCandidate(
  id: string,
  input: Partial<SourceCandidate>,
) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("source_candidates")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
