import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type PlatformInsert = Database["public"]["Tables"]["platforms"]["Insert"];
type PlatformUpdate = Database["public"]["Tables"]["platforms"]["Update"];

export async function listPlatforms(filters?: {
  search?: string;
  category?: string;
  status?: string;
}) {
  const supabase = createAdminSupabaseClient();
  let query = supabase
    .from("platforms")
    .select("*")
    .order("updated_at", { ascending: false });

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,slug.ilike.%${filters.search}%`);
  }

  if (filters?.category) {
    query = query.eq("category", filters.category);
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

export async function getPlatformById(id: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("platforms")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getPlatformBySlug(slug: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("platforms")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createPlatform(input: PlatformInsert) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("platforms")
    .insert(input)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updatePlatform(id: string, input: PlatformUpdate) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("platforms")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getPlatformCoverage(id: string) {
  const supabase = createAdminSupabaseClient();

  const [sources, versions, signals, evidence, tasks] = await Promise.all([
    supabase
      .from("policy_sources")
      .select("*", { count: "exact", head: true })
      .eq("platform_id", id),
    supabase
      .from("document_versions")
      .select("policy_sources!inner(platform_id)", { count: "exact", head: true })
      .eq("policy_sources.platform_id", id),
    supabase
      .from("signals")
      .select("*", { count: "exact", head: true })
      .eq("platform_id", id),
    supabase
      .from("evidence_items")
      .select("signals!inner(platform_id)", { count: "exact", head: true })
      .eq("signals.platform_id", id),
    supabase
      .from("editorial_tasks")
      .select("*")
      .eq("platform_id", id)
      .order("updated_at", { ascending: false })
      .limit(8),
  ]);

  return {
    sources: sources.count ?? 0,
    versions: versions.count ?? 0,
    signals: signals.count ?? 0,
    evidence: evidence.count ?? 0,
    tasks: tasks.data ?? [],
  };
}
