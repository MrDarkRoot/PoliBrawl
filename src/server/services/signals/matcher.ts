import "server-only";

import { listClauses } from "@/server/repositories/document-repository";
import {
  createSignalCandidate,
  findSignalCandidateByRule,
  listSignalRules,
} from "@/server/repositories/signal-repository";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

function normalizeList(value: unknown) {
  return Array.isArray(value)
    ? value.map((entry) => String(entry).trim()).filter(Boolean)
    : [];
}

function matchKeywords(clauseText: string, keywords: string[]) {
  const lowered = clauseText.toLowerCase();
  return keywords.filter((keyword) => lowered.includes(keyword.toLowerCase()));
}

function matchRegex(clauseText: string, patterns: string[]) {
  return patterns.flatMap((pattern) => {
    try {
      const regex = new RegExp(pattern, "i");
      return regex.test(clauseText) ? [pattern] : [];
    } catch {
      return [];
    }
  });
}

export async function runSignalMatcher(filters?: { sourceId?: string }) {
  const rules = await listSignalRules();
  const clauses = await listClauses(filters);
  const supabase = createAdminSupabaseClient();

  const versionIds = Array.from(
    new Set(
      clauses
        .map((clause) => clause.document_versions?.policy_source_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const { data: sources } = await supabase
    .from("policy_sources")
    .select("id, platform_id")
    .in("id", versionIds);

  const sourceMap = new Map(
    (sources ?? []).map((source) => [source.id, source.platform_id]),
  );

  let created = 0;

  for (const rule of rules.filter((item) => item.enabled)) {
    const keywords = normalizeList(rule.keywords);
    const regexPatterns = normalizeList(rule.regex_patterns);

    for (const clause of clauses) {
      const text = String(clause.clause_text ?? "");
      const keywordMatches = matchKeywords(text, keywords);
      const regexMatches = matchRegex(text, regexPatterns);
      const matchedTerms = [...new Set([...keywordMatches, ...regexMatches])];

      if (!matchedTerms.length) {
        continue;
      }

      const existing = await findSignalCandidateByRule(rule.id, clause.id);
      if (existing) {
        continue;
      }

      const policySourceId = clause.document_versions?.policy_source_id;
      if (!policySourceId) {
        continue;
      }

      const platformId = sourceMap.get(policySourceId);
      if (!platformId) {
        continue;
      }

      await createSignalCandidate({
        clause_id: clause.id,
        platform_id: platformId,
        policy_source_id: policySourceId,
        rule_id: rule.id,
        suggested_signal: rule.signal_name,
        suggested_category: rule.category,
        suggested_level: rule.suggested_level,
        confidence: rule.confidence_weight,
        matched_terms: matchedTerms,
      });
      created += 1;
    }
  }

  return {
    created,
  };
}
