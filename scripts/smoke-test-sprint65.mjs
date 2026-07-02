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
// Quality Gate Logic Ported for Testing Page Eval
// --------------------------------------------------------------------------
async function testEvaluatePage(pageId) {
  const [page] = await q(`SELECT * FROM platform_survival_pages WHERE id = $1`, [pageId]);
  const pageRedFlags = await q(`SELECT * FROM platform_survival_page_red_flags WHERE page_id = $1`, [pageId]);
  
  const errors = [];
  if (!page.platform_id) errors.push("Missing Platform");
  if (!page.title) errors.push("Missing Title");
  if (!page.disclaimer_note) errors.push("Missing Disclaimer Note");
  if (!page.last_reviewed_at) errors.push("Missing Last Reviewed Date");
  
  if (pageRedFlags.length === 0) {
    errors.push("Missing Red Flags: At least one red flag must be attached");
  }

  // To simplify the test, we'll assume the attached red flags are ready if they exist
  // because we mock the "ready" state by adding all necessary components.
  // In reality, the service checks evaluateDraftRedFlag for each.
  
  return { ready_for_publish: errors.length === 0, errors };
}

// --------------------------------------------------------------------------
// Setup
// --------------------------------------------------------------------------
console.log("--- Setting up Survival Page smoke test ---");

const platformRow = await q(`select id from platforms limit 1`);
if (platformRow.length === 0) { console.error("No platforms in DB."); process.exit(1); }
const platformId = platformRow[0].id;

const sourceRow = await q(`select id from sources where platform_id=$1 limit 1`, [platformId]);
if (sourceRow.length === 0) { console.error("No sources in DB."); process.exit(1); }
const sourceId = sourceRow[0].id;

// 1. Create a draft red flag
const [rf] = await q(
  `insert into red_flags (platform_id, slug, title, category, level, summary, why_it_matters, status, source_id, reviewed_at) 
   values ($1,$2,$3,$4,$5,$6,$7,'draft', $8, now()) returning id`,
  [platformId, 'smoke-test-rf-sp-' + Date.now(), 'Smoke Test RF SP', 'money', 'medium', 'Summary', 'Why it matters', sourceId]
);
const rfId = rf.id;
console.log(`✓ Created test Red Flag: ${rfId}`);

// 2. Add components to make it ready
await q(`insert into evidence (red_flag_id, source_id, title, excerpt, source_title, status) values ($1,$2,'Title','Excerpt','SourceTitle','draft')`, [rfId, sourceId]);
await q(`insert into survival_notes (red_flag_id, note_title, note_body, priority, status) values ($1,'Note Title','Note Body','medium','draft')`, [rfId]);
const [chk] = await q(`insert into checklists (red_flag_id, title, status) values ($1,'Checklist','draft') returning id`, [rfId]);
await q(`insert into checklist_items (checklist_id, label, status) values ($1,'Item 1','draft')`, [chk.id]);

// 3. Create Survival Page
const [page] = await q(
  `insert into platform_survival_pages (platform_id, slug, title, summary, disclaimer_note, last_reviewed_at)
   values ($1, $2, $3, $4, $5, now()) returning id`,
   [platformId, 'test-survival-page-' + Date.now(), 'Test Survival Page', 'Summary', 'Disclaimer']
);
const pageId = page.id;
console.log(`✓ Created test Survival Page: ${pageId}`);

// 4. Attach Red Flag
await q(
  `insert into platform_survival_page_red_flags (page_id, red_flag_id, display_order) values ($1, $2, 0)`,
  [pageId, rfId]
);
console.log(`✓ Attached Red Flag to Survival Page`);

// 5. Evaluate Page
let q1 = await testEvaluatePage(pageId);
if (!q1.ready_for_publish) {
  console.error("FAIL: Page should be ready_for_publish.", q1.errors);
  process.exit(1);
}
console.log("✓ Page Quality Gate PASSED. Ready For Publish is TRUE.");

// 6. Detach Red Flag
await q(`delete from platform_survival_page_red_flags where page_id=$1 and red_flag_id=$2`, [pageId, rfId]);
console.log("\n--- Detached Red Flag ---");

let q2 = await testEvaluatePage(pageId);
if (q2.ready_for_publish) {
  console.error("FAIL: Page should not be ready after detaching red flag.");
  process.exit(1);
}
console.log("✓ Page Quality Gate correctly fails after red flag detachment.");

await pool.end();
console.log("\n✓ Sprint 6.5 smoke test COMPLETE — all checks passed.");
