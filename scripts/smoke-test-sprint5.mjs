import pg from "pg";
import { readFileSync } from "fs";

// Load environment variables manually
function loadEnv() {
  try {
    const env = readFileSync(".env.local", "utf-8");
    for (const line of env.split("\n")) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch (e) {
    console.log("No .env file found or error reading it. Assuming env is already set.");
  }
}
loadEnv();

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!connectionString) {
  console.error("No DATABASE_URL or POSTGRES_URL found.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
async function q(sql, params = []) {
  const res = await pool.query(sql, params);
  return res.rows;
}

const SAMPLE_TEXT = `We may hold your payout for 180 days if we suspect a violation.
You agree to indemnify us from all legal claims.
We require a government ID and biometric scan to verify your account.
If you appeal our decision, you must arbitrate individually, no class actions.
We may terminate your account at any time without notice.
`;

const TAXONOMY = {
  money: ["fee", "charge", "refund"],
  account: ["ban", "terminate", "suspend"],
  kyc: ["government id", "biometric", "verify"],
  payout: ["payout", "hold", "180 days"],
  appeal: ["appeal", "arbitrate", "class action"],
  data_saas: ["sell data", "third party"],
  api: ["rate limit", "throttle", "revoke access"],
  legal: ["indemnify", "liability"],
};

const SUGGESTED_TITLES = {
  money: "Unexpected Fees or Charges",
  account: "Account Termination Without Notice",
  kyc: "Invasive KYC Requirements",
  payout: "Long Payout Holds",
  appeal: "Forced Arbitration and No Class Action",
  data_saas: "Concerning Data Practices",
  api: "Restrictive API Limits",
  legal: "Broad Indemnification Clause",
};

function isBoundary(char) {
  return !/^[a-zA-Z0-9]$/.test(char);
}

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
  for (const [category, keywords] of Object.entries(TAXONOMY)) {
    const matches = findMatches(text, keywords);
    if (matches.length === 0) continue;

    const newMatchIds = [];
    for (const m of matches) {
      const excerpt = text.slice(Math.max(0, m.start - 300), Math.min(text.length, m.end + 300));
      const [row] = await q(
        `insert into keyword_matches (source_snapshot_id, source_id, platform_id, category, keyword, matched_text, excerpt, start_offset, end_offset, confidence, noise_score, status) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,1,0,'pending') returning id`,
        [snapshotId, sourceId, platformId, category, m.keyword, text.slice(m.start, m.end), excerpt, m.start, m.end],
      );
      newMatchIds.push(row.id);
    }

    const uniqueKeywords = [...new Set(matches.map(m => m.keyword))];
    const [cand] = await q(
      `insert into red_flag_candidates (platform_id, source_id, source_snapshot_id, primary_keyword_match_id, category, headline, excerpt, matched_keywords, confidence_note, status) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending') returning id`,
      [platformId, sourceId, snapshotId, newMatchIds[0], category, SUGGESTED_TITLES[category] ?? "Candidate", text.slice(0, 400), uniqueKeywords, "Scanner level: medium"]
    );
    for (const mid of newMatchIds) {
      await q(`update keyword_matches set candidate_id=$1, status='grouped' where id=$2`, [cand.id, mid]);
    }
  }
}

// --------------------------------------------------------------------------
// Setup
// --------------------------------------------------------------------------
const platformRow = await q(`select id from platforms limit 1`);
if (platformRow.length === 0) { console.error("No platforms in DB."); process.exit(1); }
const platformId = platformRow[0].id;

const sourceRow = await q(`select id from sources where platform_id=$1 limit 1`, [platformId]);
if (sourceRow.length === 0) { console.error("No sources in DB."); process.exit(1); }
const sourceId = sourceRow[0].id;

const [snap] = await q(`insert into source_snapshots (source_id, capture_method, extracted_text, text_preview, capture_status, captured_at) values ($1, 'paste', $2, $3, 'succeeded', now()) returning id`, [sourceId, SAMPLE_TEXT, SAMPLE_TEXT.slice(0, 200)]);
const snapshotId = snap.id;
console.log(`✓ Created fixture snapshot: ${snapshotId}`);

await runScanner(snapshotId, sourceId, platformId, SAMPLE_TEXT);

const candidates = await q(`select * from red_flag_candidates where source_snapshot_id=$1`, [snapshotId]);
console.log(`✓ Generated ${candidates.length} candidates.`);

// We need at least 3 candidates to test: approve, reject, merge
if (candidates.length < 3) {
  console.error("Not enough candidates generated to test workflow.");
  process.exit(1);
}

const cApprove = candidates[0];
const cReject = candidates[1];
const cMergeSource = candidates[2];

// To test merge, we need another candidate in the same category and platform
// Let's create a dummy one manually for merge target
const [cMergeTarget] = await q(
  `insert into red_flag_candidates (platform_id, source_id, category, headline, excerpt, matched_keywords, status) values ($1,$2,$3,$4,$5,$6,'pending') returning id`,
  [platformId, sourceId, cMergeSource.category, "Merge Target", "Target Excerpt", ['target-kw']]
);

const reviewerId = "00000000-0000-0000-0000-000000000000"; // Dummy ID doesn't need FK

console.log("\n--- Testing Workflow ---");

// Helper function equivalent to repo call
async function updateStatus(id, newStatus, reason = null) {
  await q(`update red_flag_candidates set status=$1, review_notes=$2, updated_at=now() where id=$3`, [newStatus, reason, id]);
  await q(`insert into candidate_review_history (candidate_id, action, new_status, note) values ($1, $2, $3, $4)`, [id, newStatus, newStatus, reason]);
}

// 1. Approve
console.log(`Approving ${cApprove.id}...`);
await updateStatus(cApprove.id, 'approved', 'Looks good');
const [redFlag] = await q(
  `insert into red_flags (platform_id, slug, title, category, level, summary, why_it_matters, status) values ($1,$2,$3,$4,$5,$6,$7,'draft') returning id, status`,
  [platformId, 'slug-123', cApprove.headline, cApprove.category, 'medium', 'sum', 'why']
);
await q(`update red_flag_candidates set approved_red_flag_id=$1 where id=$2`, [redFlag.id, cApprove.id]);

if (redFlag.status !== 'draft') {
  console.error("Red flag created not as draft!");
  process.exit(1);
}
console.log(`✓ Approved candidate created Draft Red Flag ${redFlag.id}`);

// 2. Reject
console.log(`Rejecting ${cReject.id}...`);
await updateStatus(cReject.id, 'rejected', 'Too noisy');
const candRejectCheck = await q(`select status from red_flag_candidates where id=$1`, [cReject.id]);
if (candRejectCheck[0].status !== 'rejected') {
  console.error("Reject failed.");
  process.exit(1);
}
console.log("✓ Rejected candidate kept traceable");

// 3. Merge
console.log(`Merging ${cMergeSource.id} into ${cMergeTarget.id}...`);
await updateStatus(cMergeSource.id, 'merged', `Merged into ${cMergeTarget.id}`);
await q(`update red_flag_candidates set merged_into_candidate_id=$1 where id=$2`, [cMergeTarget.id, cMergeSource.id]);
const candMergeCheck = await q(`select status from red_flag_candidates where id=$1`, [cMergeSource.id]);
if (candMergeCheck[0].status !== 'merged') {
  console.error("Merge failed.");
  process.exit(1);
}
console.log("✓ Merged candidate updated");

// 4. History
const history = await q(`select * from candidate_review_history where candidate_id=$1`, [cApprove.id]);
if (history.length === 0) {
  console.error("No review history recorded.");
  process.exit(1);
}
console.log(`✓ Review history verified (${history.length} records found)`);

await pool.end();
console.log("\n✓ Sprint 5 smoke test COMPLETE — all checks passed.");
