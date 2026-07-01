import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function listDocumentVersions(sourceId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("document_versions")
    .select("*")
    .eq("policy_source_id", sourceId)
    .order("version_number", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function getDocumentVersionById(id: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("document_versions")
    .select("*, policy_sources(*)")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getLatestVersionForSource(sourceId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("document_versions")
    .select("*")
    .eq("policy_source_id", sourceId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getVersionByHash(sourceId: string, textHash: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("document_versions")
    .select("*")
    .eq("policy_source_id", sourceId)
    .eq("text_hash", textHash)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createDocumentVersion(input: {
  policy_source_id: string;
  version_number: number;
  text_hash: string;
  markdown_text?: string | null;
  plain_text?: string | null;
  extraction_confidence?: number | null;
  extraction_method?: string | null;
  effective_date?: string | null;
}) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("document_versions")
    .insert({
      ...input,
      review_status: "unreviewed",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateSourceHash(input: {
  sourceId: string;
  currentHash: string;
  finalUrl?: string | null;
}) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("policy_sources")
    .update({
      current_hash: input.currentHash,
      final_url: input.finalUrl ?? undefined,
      last_fetched_at: new Date().toISOString(),
    })
    .eq("id", input.sourceId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createPolicyChange(input: {
  platform_id: string;
  policy_source_id: string;
  old_version_id?: string | null;
  new_version_id?: string | null;
  old_hash?: string | null;
  new_hash?: string | null;
}) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("policy_changes")
    .insert({
      ...input,
      status: "needs_review",
      importance: "unknown",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function replaceSections(
  versionId: string,
  sections: Array<{
    parent_section_id?: string | null;
    heading?: string | null;
    section_order: number;
    section_text?: string | null;
    anchor?: string | null;
  }>,
) {
  const supabase = createAdminSupabaseClient();
  await supabase.from("sections").delete().eq("document_version_id", versionId);

  if (!sections.length) {
    return [];
  }

  const { data, error } = await supabase
    .from("sections")
    .insert(
      sections.map((section) => ({
        ...section,
        document_version_id: versionId,
      })),
    )
    .select("*");

  if (error) {
    throw error;
  }

  return data;
}

export async function replaceClauses(
  versionId: string,
  clauses: Array<{
    section_id?: string | null;
    clause_order: number;
    clause_text: string;
    clause_hash: string;
    word_count: number;
  }>,
) {
  const supabase = createAdminSupabaseClient();
  await supabase.from("clauses").delete().eq("document_version_id", versionId);

  if (!clauses.length) {
    return [];
  }

  const { data, error } = await supabase
    .from("clauses")
    .insert(
      clauses.map((clause) => ({
        ...clause,
        document_version_id: versionId,
      })),
    )
    .select("*");

  if (error) {
    throw error;
  }

  return data;
}

export async function listClauses(filters?: { search?: string; sourceId?: string }) {
  const supabase = createAdminSupabaseClient();
  let query = supabase
    .from("clauses")
    .select("*, sections(heading), document_versions(policy_source_id, version_number)")
    .order("created_at", { ascending: false })
    .limit(250);

  if (filters?.search) {
    query = query.ilike("clause_text", `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const rows = data ?? [];

  if (!filters?.sourceId) {
    return rows;
  }

  return rows.filter(
    (row) => row.document_versions?.policy_source_id === filters.sourceId,
  );
}

export async function getClauseById(id: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("clauses")
    .select("*, sections(*), document_versions(*, policy_sources(*))")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}
