import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { EvidenceInput, SignalApprovalInput } from "@/lib/validation/evidence";
import type { RuleInput } from "@/lib/validation/rule";

export async function listSignalRules() {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("signal_rules")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function getSignalRuleById(id: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("signal_rules")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createSignalRule(input: RuleInput) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("signal_rules")
    .insert(input)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateSignalRule(id: string, input: Partial<RuleInput>) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("signal_rules")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function listSignalCandidates(filters?: {
  status?: string;
  platformId?: string;
}) {
  const supabase = createAdminSupabaseClient();
  let query = supabase
    .from("signal_candidates")
    .select("*, signal_rules(rule_name), clauses(clause_text), policy_sources(title, url), platforms(name)")
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

export async function findSignalCandidateByRule(ruleId: string, clauseId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("signal_candidates")
    .select("*")
    .eq("rule_id", ruleId)
    .eq("clause_id", clauseId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createSignalCandidate(input: {
  clause_id: string;
  platform_id: string;
  policy_source_id: string;
  rule_id?: string | null;
  suggested_signal: string;
  suggested_category: string;
  suggested_level: string;
  confidence?: number | null;
  matched_terms: string[];
  detection_method?: "rule" | "ai" | "manual" | "hybrid";
}) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("signal_candidates")
    .insert({
      ...input,
      detection_method: input.detection_method ?? "rule",
      matched_terms: input.matched_terms,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getSignalCandidateById(id: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("signal_candidates")
    .select("*, clauses(*, sections(*), document_versions(*, policy_sources(*, platforms(*)))), signal_rules(*)")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateSignalCandidate(id: string, input: Record<string, unknown>) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("signal_candidates")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createSignal(
  platformId: string,
  input: SignalApprovalInput & { approvedBy: string },
) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("signals")
    .insert({
      platform_id: platformId,
      category: input.category,
      name: input.name,
      level: input.level,
      confidence: input.confidence,
      explanation: input.explanation ?? null,
      internal_reason: input.internal_reason ?? null,
      status: "approved",
      approved_by: input.approvedBy,
      approved_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getSignalById(id: string) {
  const supabase = createAdminSupabaseClient();
  const [{ data: signal, error: signalError }, { data: evidence, error: evidenceError }] =
    await Promise.all([
      supabase.from("signals").select("*, platforms(*)").eq("id", id).single(),
      supabase
        .from("evidence_items")
        .select("*")
        .eq("signal_id", id)
        .order("updated_at", { ascending: false }),
    ]);

  if (signalError) {
    throw signalError;
  }

  if (evidenceError) {
    throw evidenceError;
  }

  return {
    signal,
    evidence,
  };
}

export async function createEvidence(
  signalId: string,
  input: EvidenceInput & { created_by?: string | null },
) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("evidence_items")
    .insert({
      signal_id: signalId,
      clause_id: input.clause_id ?? null,
      policy_source_id: input.policy_source_id,
      document_version_id: input.document_version_id ?? null,
      clause_excerpt: input.clause_excerpt,
      source_url: input.source_url,
      document_title: input.document_title ?? null,
      review_date: input.review_date,
      explanation: input.explanation,
      why_it_matters: input.why_it_matters ?? null,
      visibility: input.visibility,
      status: input.status,
      created_by: input.created_by ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getEvidenceById(id: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("evidence_items")
    .select("*, policy_sources(*), document_versions(*)")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}
