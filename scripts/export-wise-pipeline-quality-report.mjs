import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadEnvFile(filename) {
  const envPath = path.resolve(__dirname, "..", filename);

  try {
    const contents = await fs.readFile(envPath, "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      if (!key || key in process.env) {
        continue;
      }

      let value = trimmed.slice(separatorIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return;
    }

    throw error;
  }
}

await loadEnvFile(".env.local");
await loadEnvFile(".env");

const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!baseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase environment variables.");
}

async function fetchRest(pathname) {
  const response = await fetch(`${baseUrl}/rest/v1/${pathname}`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`REST request failed for ${pathname}: ${response.status}`);
  }

  return response.json();
}

function codeBlock(value) {
  return `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``;
}

function buildDiagnostics({
  rawCandidateCount,
  filteredCounts,
  plainTextLength,
  extractionConfidence,
  sectionCount,
  clauseCount,
  tinyClauseCount,
  signalCandidateCount,
  source,
}) {
  const diagnostics = [];

  if (rawCandidateCount > 200) {
    diagnostics.push({
      code: "discovery.too_many_candidates",
      message: `Discovery produced ${rawCandidateCount} raw candidates.`,
    });
  }

  if (plainTextLength < 1500) {
    diagnostics.push({
      code: "extraction.text_too_short",
      message: `Extracted plain text is short (${plainTextLength} chars).`,
    });
  }

  if ((extractionConfidence ?? 0) < 0.7) {
    diagnostics.push({
      code: "extraction.low_confidence",
      message: `Extraction confidence is low (${extractionConfidence ?? 0}).`,
    });
  }

  if (sectionCount < 3) {
    diagnostics.push({
      code: "sections.too_few",
      message: `Only ${sectionCount} sections were generated.`,
    });
  }

  if (clauseCount && tinyClauseCount / clauseCount >= 0.25) {
    diagnostics.push({
      code: "clauses.too_many_tiny",
      message: `${tinyClauseCount} of ${clauseCount} clauses are tiny.`,
    });
  }

  if (!signalCandidateCount) {
    diagnostics.push({
      code: "signals.none_found",
      message: "No signal candidates were generated for this version.",
    });
  }

  if (
    source?.source_tier === "tier_1_core" &&
    source?.content_source_tier === "tier_4_ignore"
  ) {
    diagnostics.push({
      code: "classification.core_conflict",
      message: "Source is tier_1_core but content classification suggests low-value.",
    });
  }

  if (
    ["marketing_page", "generic_blog_post", "blog_context", "newsroom_article", "landing_page", "other"].includes(
      source?.content_document_type ?? "",
    )
  ) {
    diagnostics.push({
      code: "classification.low_value_content",
      message: `Content classification suggests low-value content (${source?.content_document_type}).`,
    });
  }

  diagnostics.push({
    code: "discovery.filtered_counts",
    message: `keep=${filteredCounts.keep ?? 0}, maybe=${filteredCounts.maybe ?? 0}, drop=${filteredCounts.drop ?? 0}`,
  });

  return diagnostics;
}

const [platform] = await fetchRest(
  "platforms?slug=eq.wise&select=*&limit=1",
);

if (!platform) {
  throw new Error("Wise platform not found.");
}

const [latestRun] = await fetchRest(
  `discovery_runs?platform_id=eq.${platform.id}&select=*&order=started_at.desc&limit=1`,
);

const sourceCandidates = await fetchRest(
  `source_candidates?discovery_run_id=eq.${latestRun.id}&select=id,url,title,suggested_document_type,suggested_tier,confidence,detection_reason,filter_score,filter_decision,filter_reasons,status,canonical_url,content_document_type,content_source_tier,content_confidence,content_classification_reasons&order=filter_score.desc`,
);

const approvedSources = await fetchRest(
  `policy_sources?platform_id=eq.${platform.id}&select=*&order=updated_at.desc`,
);

const primarySource =
  [...approvedSources].sort((left, right) => {
    const score = (source) => {
      let total = 0;
      if (source.document_type === "terms_of_service") total += 100;
      if (source.content_document_type === "terms_of_service") total += 100;
      if (source.document_type === "privacy_policy") total += 80;
      if (source.content_document_type === "privacy_policy") total += 80;
      if (source.current_hash) total += 20;
      if (source.last_fetched_at) total += 10;
      return total;
    };

    return score(right) - score(left);
  })[0];

if (!primarySource) {
  throw new Error("No approved Wise policy source found.");
}

const fetchLogs = await fetchRest(
  `fetch_logs?policy_source_id=eq.${primarySource.id}&select=id,requested_url,final_url,http_status,content_type,response_size,success,error_message,fetched_at&order=fetched_at.desc`,
);

const [latestVersion] = await fetchRest(
  `document_versions?policy_source_id=eq.${primarySource.id}&select=*&order=version_number.desc&limit=1`,
);

if (!latestVersion) {
  throw new Error("No document version found for the primary Wise source.");
}

const sections = await fetchRest(
  `sections?document_version_id=eq.${latestVersion.id}&select=id,heading,section_order,anchor,section_text&order=section_order.asc`,
);

const clauses = await fetchRest(
  `clauses?document_version_id=eq.${latestVersion.id}&select=id,clause_order,clause_text,clause_hash,word_count&order=clause_order.asc`,
);

const evidenceItems = await fetchRest(
  `evidence_items?policy_source_id=eq.${primarySource.id}&select=*&order=created_at.desc`,
);

const signalCandidates = await fetchRest(
  `signal_candidates?policy_source_id=eq.${primarySource.id}&select=id,rule_id,suggested_signal,suggested_category,suggested_level,confidence,matched_terms,status,created_at&order=created_at.desc`,
);

const signalIds = Array.from(
  new Set(evidenceItems.map((item) => item.signal_id).filter(Boolean)),
);
const signals = signalIds.length
  ? await fetchRest(`signals?id=in.(${signalIds.join(",")})&select=*&order=created_at.desc`)
  : [];

const keptCandidates = sourceCandidates
  .filter((candidate) => candidate.filter_decision === "keep")
  .slice(0, 30);
const droppedCandidates = sourceCandidates
  .filter((candidate) => candidate.filter_decision === "drop")
  .slice(0, 30);

const diagnostics = buildDiagnostics({
  rawCandidateCount: Number(latestRun.metadata?.rawCandidateCount ?? sourceCandidates.length),
  filteredCounts: latestRun.metadata?.filteredCounts ?? {},
  plainTextLength: latestVersion.plain_text?.length ?? 0,
  extractionConfidence: latestVersion.extraction_confidence,
  sectionCount: sections.length,
  clauseCount: clauses.length,
  tinyClauseCount: clauses.filter((clause) => (clause.word_count ?? 0) <= 4).length,
  signalCandidateCount: signalCandidates.length,
  source: primarySource,
});

const report = [
  "# Wise Pipeline Quality Report",
  "",
  "## Platform metadata",
  codeBlock(platform),
  "",
  "## Discovery summary",
  codeBlock({
    latest_run: latestRun,
    raw_candidate_count: latestRun.metadata?.rawCandidateCount ?? sourceCandidates.length,
    filtered_counts: latestRun.metadata?.filteredCounts ?? {},
  }),
  "",
  "## Top 30 kept candidates",
  codeBlock(keptCandidates),
  "",
  "## Top 30 dropped candidates with reasons",
  codeBlock(droppedCandidates),
  "",
  "## Approved policy sources",
  codeBlock(approvedSources),
  "",
  "## Fetch results",
  codeBlock(fetchLogs),
  "",
  "## Content classification results",
  codeBlock({
    primary_source_id: primarySource.id,
    approved_source_classifications: approvedSources.map((source) => ({
      id: source.id,
      url: source.url,
      document_type: source.document_type,
      source_tier: source.source_tier,
      content_document_type: source.content_document_type,
      content_source_tier: source.content_source_tier,
      content_confidence: source.content_confidence,
    })),
    primary_source: primarySource,
    latest_version: {
      id: latestVersion.id,
      version_number: latestVersion.version_number,
      text_hash: latestVersion.text_hash,
      extraction_method: latestVersion.extraction_method,
      extraction_confidence: latestVersion.extraction_confidence,
      plain_text_length: latestVersion.plain_text?.length ?? 0,
      markdown_length: latestVersion.markdown_text?.length ?? 0,
    },
  }),
  "",
  "## Pipeline inspector summary",
  codeBlock({
    sections,
    first_20_clauses: clauses.slice(0, 20),
    signal_candidates: signalCandidates,
    approved_signals: signals,
    evidence_items: evidenceItems,
  }),
  "",
  "## Data quality diagnostics",
  codeBlock(diagnostics),
];

const outputPath = path.resolve(
  __dirname,
  "..",
  "reports",
  "wise-pipeline-quality-report.md",
);

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${report.join("\n")}\n`);

console.log(outputPath);
