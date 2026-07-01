import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { SourceInput } from "@/lib/validation/source";

export async function listPolicySources(filters?: {
  platformId?: string;
  documentType?: string;
  sourceTier?: string;
  status?: string;
}) {
  const supabase = createAdminSupabaseClient();
  let query = supabase
    .from("policy_sources")
    .select("*, platforms(name, slug)")
    .order("updated_at", { ascending: false });

  if (filters?.platformId) {
    query = query.eq("platform_id", filters.platformId);
  }
  if (filters?.documentType) {
    query = query.eq("document_type", filters.documentType);
  }
  if (filters?.sourceTier) {
    query = query.eq("source_tier", filters.sourceTier);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
}

export async function getPolicySourceById(id: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("policy_sources")
    .select("*, platforms(*)")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function findPolicySourceByPlatformUrl(platformId: string, url: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("policy_sources")
    .select("*")
    .eq("platform_id", platformId)
    .eq("url", url)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createPolicySource(input: SourceInput & { created_by?: string | null }) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("policy_sources")
    .insert({
      ...input,
      title: input.title || null,
      final_url: input.final_url || null,
      last_reviewed_at: input.last_reviewed_at ?? null,
      created_by: input.created_by ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updatePolicySource(id: string, input: Partial<SourceInput>) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("policy_sources")
    .update({
      ...input,
      title: input.title ?? undefined,
      final_url: input.final_url ?? undefined,
      last_reviewed_at: input.last_reviewed_at ?? undefined,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createFetchLog(input: {
  policy_source_id: string;
  requested_url: string;
  final_url?: string | null;
  http_status?: number | null;
  content_type?: string | null;
  response_size?: number | null;
  success?: boolean;
  error_message?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("fetch_logs")
    .insert({
      ...input,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function listFetchLogs(sourceId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("fetch_logs")
    .select("*")
    .eq("policy_source_id", sourceId)
    .order("fetched_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function getLatestSuccessfulFetchLog(sourceId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("fetch_logs")
    .select("*")
    .eq("policy_source_id", sourceId)
    .eq("success", true)
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
