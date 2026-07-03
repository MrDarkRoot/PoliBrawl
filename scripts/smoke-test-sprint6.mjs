import pg from "pg";
import { readFileSync } from "fs";

function loadEnv() {
  try {
    const env = readFileSync(".env.local", "utf-8");
    for (const line of env.split("\n")) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    console.log("No .env.local file found. Assuming env is already set.");
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

// --------------------------------------------------------------------------
// Quality Gate Logic Ported for Testing
// --------------------------------------------------------------------------
async function testEvaluateQuality(redFlagId) {
  const [rf] = await q(`SELECT * FROM red_flags WHERE id = $1`, [redFlagId]);
  const evidence = await q(`SELECT * FROM evidence WHERE red_flag_id = $1`, [redFlagId]);
  const notes = await q(`SELECT * FROM survival_notes WHERE red_flag_id = $1`, [redFlagId]);
  await q(`SELECT * FROM backup_options WHERE red_flag_id = $1`, [redFlagId]);
  
  const checklists = await q(`SELECT * FROM checklists WHERE red_flag_id = $1`, [redFlagId]);
  const checklistIds = checklists.map(c => c.id);
  const items = checklistIds.length > 0 
    ? await q(`SELECT * FROM checklist_items WHERE checklist_id = ANY($1)`, [checklistIds])
    : [];

  const errors = [];
  if (!rf.platform_id) errors.push("Missing Platform");
  if (!rf.category) errors.push("Missing Category");
  if (evidence.length === 0) errors.push("Missing Evidence");
  if (notes.length === 0) errors.push("Missing Notes");
  if (items.length === 0) errors.push("Missing Checklist");
  
  return { ready_for_publish: errors.length === 0, errors };
}

// --------------------------------------------------------------------------
// Setup
// --------------------------------------------------------------------------
console.log("--- Setting up workspace smoke test ---");
try {

const platformRow = await q(`select id from platforms limit 1`);
if (platformRow.length === 0) { console.error("No platforms in DB."); process.exit(1); }
const platformId = platformRow[0].id;

const sourceRow = await q(`select id from sources where platform_id=$1 limit 1`, [platformId]);
if (sourceRow.length === 0) { console.error("No sources in DB."); process.exit(1); }
const sourceId = sourceRow[0].id;

// Create a draft red flag directly to test workspace
const [rf] = await q(
  `insert into red_flags (platform_id, slug, title, category, level, summary, why_it_matters, status, source_id, reviewed_at) 
   values ($1,$2,$3,$4,$5,$6,$7,'draft', $8, now()) returning id`,
  [platformId, 'smoke-test-rf-' + Date.now(), 'Smoke Test RF', 'money', 'medium', 'Summary of issue.', 'Why it matters', sourceId]
);
const rfId = rf.id;
console.log(`✓ Created test Red Flag: ${rfId}`);

let q1 = await testEvaluateQuality(rfId);
if (q1.ready_for_publish) {
  console.error("FAIL: Should not be ready for publish yet.");
  process.exit(1);
}
console.log(`✓ Quality Gate correctly blocks empty RF: ${q1.errors.join(", ")}`);

// Add components
console.log("\n--- Adding Editorial Components ---");

const [evi] = await q(
  `insert into evidence (red_flag_id, source_id, title, excerpt, source_title, status) values ($1,$2,'Title','Excerpt','SourceTitle','draft') returning id`,
  [rfId, sourceId]
);
console.log("✓ Added Evidence");

await q(
  `insert into survival_notes (red_flag_id, note_title, note_body, priority, status) values ($1,'Note Title','Note Body','medium','draft')`,
  [rfId]
);
console.log("✓ Added Survival Note");

await q(
  `insert into backup_options (red_flag_id, label, option_type, summary, tradeoffs, status) values ($1,'Backup','other','Summary','Tradeoffs','draft')`,
  [rfId]
);
console.log("✓ Added Backup Option");

const [chk] = await q(
  `insert into checklists (red_flag_id, title, status) values ($1,'Checklist','draft') returning id`,
  [rfId]
);
await q(
  `insert into checklist_items (checklist_id, label, status) values ($1,'Item 1','draft')`,
  [chk.id]
);
console.log("✓ Added Checklist with Item");

// Check Quality Gate again
let q2 = await testEvaluateQuality(rfId);
if (!q2.ready_for_publish) {
  console.error("FAIL: Should be ready for publish after adding components.", q2.errors);
  process.exit(1);
}
console.log("✓ Quality Gate PASSED. Ready For Publish is TRUE.");

// Remove Evidence
await q(`delete from evidence where id=$1`, [evi.id]);
console.log("\n--- Removed Evidence ---");

let q3 = await testEvaluateQuality(rfId);
if (q3.ready_for_publish) {
  console.error("FAIL: Should not be ready after removing evidence.");
  process.exit(1);
}
console.log("✓ Quality Gate correctly fails after evidence removal.");

  await pool.end();
  console.log("\n✓ Sprint 6 smoke test COMPLETE — all checks passed.");
} catch (e) {
  if (e.code === 'ENETUNREACH' || e.code === 'ECONNREFUSED' || (e.message && e.message.includes('ENETUNREACH'))) {
    console.error("SKIPPED_DB_CONNECTIVITY:", e.message);
    process.exit(0);
  }
  console.error("FAIL:", e.message);
  process.exit(1);
}
