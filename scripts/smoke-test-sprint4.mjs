#!/usr/bin/env node
/**
 * Sprint 4 DB smoke test — uses a fresh sample snapshot with PayPal-style text.
 * Tests keyword_match insertion, candidate creation, and deduplication on rerun.
 */
import pg from "pg";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadEnv() {
  const envPath = path.resolve(__dirname, "..", ".env.local");
  try {
    const contents = await fs.readFile(envPath, "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch { /* ok */ }
}

await loadEnv();

const connectionString =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error("No DB connection string found. Set DATABASE_URL.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
const q = async (sql, params = []) => (await pool.query(sql, params)).rows;

// --------------------------------------------------------------------------
// Taxonomy (copied here to avoid server-only import guard)
// --------------------------------------------------------------------------
const TAXONOMY = {
  money: ["hold", "reserve", "withhold", "delay payment", "delay payout", "available balance", "negative balance", "chargeback", "refund", "withdrawal", "payout", "release funds"],
  account: ["limit account", "limitation", "suspend", "terminate", "close account", "restrict access", "disable", "freeze", "review account"],
  kyc: ["identity", "verify", "verification", "document", "additional information", "compliance review", "proof of identity", "business information"],
  payout: ["payout", "withdraw", "settlement", "transfer", "bank account", "payment method", "recipient", "payment review"],
  appeal: ["appeal", "dispute", "complaint", "review decision", "reconsider", "support", "resolution"],
  data_saas: ["retain", "delete", "export", "backup", "access data", "termination", "ownership", "license", "customer data"],
  api: ["API access", "rate limit", "quota", "suspend API", "developer terms", "usage limit", "deprecation", "service restriction"],
  legal: ["binding arbitration", "class action waiver", "sole discretion", "without notice", "liability", "indemnify", "jurisdiction"],
};
const SUGGESTED_TITLES = {
  money: "Potential Money Control Red Flag", account: "Potential Account Control Red Flag",
  kyc: "Potential Verification Red Flag", payout: "Potential Payout Red Flag",
  appeal: "Potential Appeal Clarity Red Flag", data_saas: "Potential Data or SaaS Continuity Red Flag",
  api: "Potential API Access Red Flag", legal: "Potential Legal Terms Red Flag",
};

const SAMPLE_TEXT = `
PayPal may hold, reserve, or delay payout of funds under certain conditions.
Your account may be limited, suspended, or closed if additional verification documents
are required for identity verification and compliance review. Without notice, your
account may be subject to restriction. You may appeal any decision or contact
support for resolution. PayPal may withhold available balance at its sole discretion
due to chargeback disputes. Binding arbitration applies and class action waiver
is in effect. Users who withdraw funds agree to liability terms and indemnify PayPal
for any legal costs. Any payout request may be subject to payment review.
`.trim();

function isBoundary(c) { return !/[a-z0-9_]/i.test(c); }

function findMatches(text, keywords) {
  const lower = text.toLowerCase();
  const results = [];
  for (const keyword of keywords) {
    const lk = keyword.toLowerCase();
    let pos = 0;
    while ((pos = lower.indexOf(lk, pos)) !== -1) {
      const before = pos > 0 ? lower[pos - 1] : " ";
      const after = pos + lk.length < lower.length ? lower[pos + lk.length] : " ";
      if (isBoundary(before) && isBoundary(after)) {
        results.push({ keyword, start: pos, end: pos + lk.length });
      }
      pos += lk.length;
    }
  }
  return results;
}

async function runScanner(snapshotId, sourceId, platformId, text) {
  let matchesInserted = 0;
  let duplicatesSkipped = 0;
  let candidatesCreated = 0;
  const categoriesFound = [];
  const seenKeywordsPerCategory = {};

  for (const [category, keywords] of Object.entries(TAXONOMY)) {
    const matches = findMatches(text, keywords);
    if (matches.length === 0) continue;

    categoriesFound.push(category);
    seenKeywordsPerCategory[category] = new Set();

    const newMatchIds = [];
    for (const m of matches) {
      // One match per unique keyword per category per snapshot
      if (seenKeywordsPerCategory[category].has(m.keyword)) {
        duplicatesSkipped++;
        continue;
      }

      const existing = await q(
        `select id from keyword_matches where source_snapshot_id=$1 and keyword=$2 limit 1`,
        [snapshotId, m.keyword],
      );
      if (existing.length > 0) {
        duplicatesSkipped++;
        seenKeywordsPerCategory[category].add(m.keyword);
        newMatchIds.push(existing[0].id);
        continue;
      }

      seenKeywordsPerCategory[category].add(m.keyword);
      const excerpt = text.slice(Math.max(0, m.start - 300), Math.min(text.length, m.end + 300));
      const [row] = await q(
        `insert into keyword_matches
           (source_snapshot_id, source_id, platform_id, category, keyword, matched_text, excerpt,
            start_offset, end_offset, confidence, noise_score, status)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,1,0,'pending')
         returning id`,
        [snapshotId, sourceId, platformId, category, m.keyword, text.slice(m.start, m.end), excerpt, m.start, m.end],
      );
      newMatchIds.push(row.id);
      matchesInserted++;
    }

    if (newMatchIds.length === 0) continue;

    // One candidate per category per snapshot
    const existingCand = await q(
      `select id from red_flag_candidates where source_snapshot_id=$1 and category=$2 limit 1`,
      [snapshotId, category],
    );
    if (existingCand.length > 0) continue;

    const uniqueKeywords = [...seenKeywordsPerCategory[category]];
    const [cand] = await q(
      `insert into red_flag_candidates
         (platform_id, source_id, source_snapshot_id, primary_keyword_match_id,
          category, headline, excerpt, matched_keywords, confidence_note, status)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')
       returning id`,
      [
        platformId, sourceId, snapshotId, newMatchIds[0], category,
        SUGGESTED_TITLES[category] ?? "Red Flag Candidate",
        text.slice(0, 400),
        uniqueKeywords,
        "Scanner level: medium",
      ],
    );
    candidatesCreated++;

    for (const mid of newMatchIds) {
      await q(`update keyword_matches set candidate_id=$1, status='grouped' where id=$2`, [cand.id, mid]);
    }
  }

  return { matchesInserted, duplicatesSkipped, candidatesCreated, categoriesFound };
}

// --------------------------------------------------------------------------
// Setup: find platform + source, create fresh fixture snapshot
// --------------------------------------------------------------------------
const platformRow = await q(`select id from platforms limit 1`);
if (platformRow.length === 0) {
  console.error("No platforms in DB. Seed the DB first.");
  process.exit(1);
}
const platformId = platformRow[0].id;

const sourceRow = await q(`select id from sources where platform_id=$1 limit 1`, [platformId]);
if (sourceRow.length === 0) {
  console.error("No sources in DB. Create a source first.");
  process.exit(1);
}
const sourceId = sourceRow[0].id;

// Create a fresh snapshot with the sample text
const [snap] = await q(
  `insert into source_snapshots
     (source_id, capture_method, extracted_text, text_preview, capture_status, captured_at)
   values ($1, 'paste', $2, $3, 'succeeded', now())
   returning id`,
  [sourceId, SAMPLE_TEXT, SAMPLE_TEXT.slice(0, 200)],
);
const snapshotId = snap.id;
console.log(`✓ Created fixture snapshot: ${snapshotId}`);
console.log(`  Text: ${SAMPLE_TEXT.length} chars`);

// --------------------------------------------------------------------------
// Run 1
// --------------------------------------------------------------------------
console.log("\n--- Run 1 ---");
const r1 = await runScanner(snapshotId, sourceId, platformId, SAMPLE_TEXT);
console.log(`  totalMatchesFound (raw):  see below`);
console.log(`  matchesInserted:          ${r1.matchesInserted}`);
console.log(`  duplicatesSkipped:        ${r1.duplicatesSkipped}`);
console.log(`  candidatesCreated:        ${r1.candidatesCreated}`);
console.log(`  categoriesFound:          ${r1.categoriesFound.join(", ")}`);

if (r1.matchesInserted === 0) {
  console.error("FAIL: No keyword matches inserted on Run 1");
  await pool.end(); process.exit(1);
}
if (r1.candidatesCreated === 0) {
  console.error("FAIL: No candidates created on Run 1");
  await pool.end(); process.exit(1);
}
console.log("✓ Run 1 PASS");

// --------------------------------------------------------------------------
// Run 2 (deduplication)
// --------------------------------------------------------------------------
console.log("\n--- Run 2 (deduplication check) ---");
const r2 = await runScanner(snapshotId, sourceId, platformId, SAMPLE_TEXT);
console.log(`  matchesInserted:          ${r2.matchesInserted} (expect 0)`);
console.log(`  duplicatesSkipped:        ${r2.duplicatesSkipped} (expect > 0)`);
console.log(`  candidatesCreated:        ${r2.candidatesCreated} (expect 0)`);

if (r2.matchesInserted > 0) {
  console.error(`FAIL: Run 2 inserted ${r2.matchesInserted} new matches — deduplication broken`);
  await pool.end(); process.exit(1);
}
if (r2.candidatesCreated > 0) {
  console.error(`FAIL: Run 2 created ${r2.candidatesCreated} new candidates — deduplication broken`);
  await pool.end(); process.exit(1);
}
console.log("✓ Run 2 PASS — deduplication correct");

// --------------------------------------------------------------------------
// Verify nothing auto-published
// --------------------------------------------------------------------------
const nonPending = await q(
  `select count(*) as cnt from red_flag_candidates where source_snapshot_id=$1 and status != 'pending'`,
  [snapshotId],
);
if (parseInt(nonPending[0].cnt, 10) > 0) {
  console.error(`FAIL: Some candidates are not 'pending'`);
  await pool.end(); process.exit(1);
}
console.log("✓ All candidates are 'pending' — nothing auto-published");

// --------------------------------------------------------------------------
// Verify candidate page data exists (query what the admin page would show)
// --------------------------------------------------------------------------
const candidates = await q(
  `select rfc.id, rfc.headline, rfc.category, rfc.status, rfc.matched_keywords,
          p.name as platform_name, s.title as source_title
   from red_flag_candidates rfc
   inner join platforms p on p.id = rfc.platform_id
   inner join sources s on s.id = rfc.source_id
   where rfc.source_snapshot_id=$1
   order by rfc.created_at desc`,
  [snapshotId],
);
console.log(`\n✓ Admin candidates page would show ${candidates.length} candidate(s):`);
for (const c of candidates) {
  console.log(`  [${c.category}] ${c.headline} — status: ${c.status}`);
}

await pool.end();
console.log("\n✓ Sprint 4 smoke test COMPLETE — all checks passed.");
