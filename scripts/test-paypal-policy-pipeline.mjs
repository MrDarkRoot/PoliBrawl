import pg from "pg";
import { readFileSync } from "fs";
import { execSync } from "child_process";
import crypto from "crypto";

console.log("==========================================");
console.log("PayPal Policy Pipeline E2E Test");
console.log("==========================================");

// 1. Run schema apply
console.log("Applying schema...");
try {
  execSync("node scripts/apply-polibrawl-schema.mjs", { stdio: "inherit" });
  console.log("✓ schema applied");
} catch (e) {
  console.error("Failed to apply schema:", e);
  process.exit(1);
}

// Load env
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

// Cleanup function to ensure idempotency
const cleanPlatform = async (slug) => {
  const platforms = await q("select id from platforms where slug=$1", [slug]);
  if (platforms.length === 0) return;
  const platformId = platforms[0].id;
  
  await q(`delete from checklist_items where checklist_id in (select id from checklists where platform_id=$1 or red_flag_id in (select id from red_flags where platform_id=$1))`, [platformId]);
  await q(`delete from checklists where platform_id=$1 or red_flag_id in (select id from red_flags where platform_id=$1)`, [platformId]);
  await q(`delete from backup_options where platform_id=$1 or red_flag_id in (select id from red_flags where platform_id=$1)`, [platformId]);
  await q(`delete from survival_notes where red_flag_id in (select id from red_flags where platform_id=$1)`, [platformId]);
  await q(`delete from evidence where red_flag_id in (select id from red_flags where platform_id=$1)`, [platformId]);
  await q(`delete from candidate_review_history where candidate_id in (select id from red_flag_candidates where platform_id=$1)`, [platformId]);
  await q(`update keyword_matches set candidate_id=null where platform_id=$1`, [platformId]);
  await q(`delete from red_flag_candidates where platform_id=$1`, [platformId]);
  await q(`delete from platform_survival_page_red_flags where page_id in (select id from platform_survival_pages where platform_id=$1)`, [platformId]);
  await q(`delete from platform_survival_pages where platform_id=$1`, [platformId]);
  await q(`delete from red_flags where platform_id=$1`, [platformId]);
  await q(`delete from keyword_matches where platform_id=$1`, [platformId]);
  await q(`delete from source_snapshots where source_id in (select id from sources where platform_id=$1)`, [platformId]);
  await q(`delete from sources where platform_id=$1`, [platformId]);
  await q(`delete from platforms where id=$1`, [platformId]);
};

async function main() {
  await cleanPlatform('paypal-policy-pipeline-test');

  // 2. Create Platform
  const [platform] = await q(
    `insert into platforms (name, slug, category, status, summary, main_level, disclaimer_text, website_url)
     values ($1, $2, $3, $4, $5, $6, $7, $8) returning id`,
    [
      'PayPal Pipeline Test',
      'paypal-policy-pipeline-test',
      'payment',
      'published',
      'Payment platform policy test fixture',
      'medium',
      'PoliBrawl is independent and is not affiliated with, sponsored by, or endorsed by PayPal.',
      'https://www.paypal.com'
    ]
  );
  console.log("✓ platform ready");

  // 3. Create Source
  const [source] = await q(
    `insert into sources (platform_id, title, source_type, priority, status, url)
     values ($1, $2, $3, $4, $5, $6) returning id`,
    [
      platform.id,
      'PayPal Policy Pipeline Test Source',
      'payment_terms',
      'core',
      'active',
      'https://www.paypal.com/us/legalhub/useragreement-full'
    ]
  );
  console.log("✓ source ready");

  // 4. Create Source Snapshot
  const SAMPLE_TEXT = `PayPal may hold, reserve, or delay payout funds under certain conditions. Your account may be limited, suspended, or closed if additional verification documents are required. PayPal may review your account, request proof of identity, and restrict access while the review is pending. You may appeal or contact support for review, but access to funds may be delayed until the review is complete. PayPal may place a limitation on your account if there is a dispute, chargeback, refund risk, or compliance review.`;

  const contentHash = crypto.createHash("sha256").update(SAMPLE_TEXT).digest("hex");
  const wordCount = SAMPLE_TEXT.split(/\s+/).filter(Boolean).length;
  const byteSize = Buffer.byteLength(SAMPLE_TEXT, "utf8");
  const textPreview = SAMPLE_TEXT.slice(0, 200);

  const [snapshot] = await q(
    `insert into source_snapshots (source_id, capture_method, original_url, final_url, http_status, content_type, content_hash, extracted_text, text_preview, word_count, byte_size, capture_status, captured_at)
     values ($1, $2, $3, $4, 200, 'text/plain', $5, $6, $7, $8, $9, 'succeeded', now()) returning id`,
    [
      source.id,
      'paste',
      source.url,
      source.url,
      contentHash,
      SAMPLE_TEXT,
      textPreview,
      wordCount,
      byteSize
    ]
  );
  console.log("✓ snapshot created");

  // 5. Run Keyword Scanner
  const TAXONOMY = {
    money: ["hold", "reserve", "chargeback", "refund", "dispute", "delay payout"],
    account: ["limited", "suspended", "closed", "restrict access", "limitation"],
    kyc: ["verification documents", "proof of identity", "compliance review"],
    appeal: ["appeal", "support"],
  };

  const SUGGESTED_TITLES = {
    money: "Potential Money Control Red Flag",
    account: "Potential Account Control Red Flag",
    kyc: "Potential Verification Red Flag",
    appeal: "Potential Appeal Clarity Red Flag",
  };

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

  const scanResult1 = await runScanner(snapshot.id, source.id, platform.id, SAMPLE_TEXT);
  console.log(`✓ scanner found ${scanResult1.matchesInserted} matches`);
  console.log(`✓ scanner created/reused ${scanResult1.candidatesCreated} candidates`);

  // Assert: rerun scanner and verify duplicates are not created
  const scanResult2 = await runScanner(snapshot.id, source.id, platform.id, SAMPLE_TEXT);
  if (scanResult2.matchesInserted > 0 || scanResult2.candidatesCreated > 0) {
    console.error("FAIL: Deduplication check failed!");
    process.exit(1);
  }
  console.log("✓ scanner rerun dedupe OK");

  // 6. Fetch pending candidates
  const candidates = await q(
    `select * from red_flag_candidates where platform_id=$1 and category='money' limit 1`,
    [platform.id]
  );
  if (candidates.length === 0) {
    console.error("FAIL: No candidate in 'money' category found!");
    process.exit(1);
  }
  const candidate = candidates[0];

  // 7. Run candidate review workflow
  await q(`update red_flag_candidates set status='reviewing' where id=$1`, [candidate.id]);
  await q(`insert into candidate_review_history (candidate_id, action, new_status, note) values ($1, 'start_review', 'reviewing', 'Review started by test')`, [candidate.id]);

  const [redFlag] = await q(
    `insert into red_flags (platform_id, slug, title, category, level, summary, why_it_matters, status, source_id, source_snapshot_id, reviewed_at)
     values ($1, $2, $3, $4, 'medium', $5, $6, 'draft', $7, $8, now()) returning id`,
    [
      platform.id,
      'paypal-policy-pipeline-test-rf',
      'PayPal Policy Hold or Limit',
      candidate.category,
      'PayPal may hold, reserve, or delay payout funds under certain conditions. This is a draft summary for testing that is at least fifty characters long.',
      'Why it matters: your payout could be held for a long time.',
      source.id,
      snapshot.id
    ]
  );

  await q(
    `update red_flag_candidates set status='approved', approved_red_flag_id=$1 where id=$2`,
    [redFlag.id, candidate.id]
  );
  await q(`insert into candidate_review_history (candidate_id, action, new_status, note) values ($1, 'approve', 'approved', 'Approved by test')`, [candidate.id]);

  console.log("✓ candidate approved");
  console.log("✓ draft red flag created");

  // 8. Add Editorial Components
  // Evidence
  await q(
    `insert into evidence (red_flag_id, source_id, excerpt, source_title, source_url, notes, sort_order, status, reviewed_at)
     values ($1, $2, $3, $4, $5, 'Evidence notes', 0, 'approved', now())`,
    [
      redFlag.id,
      source.id,
      'PayPal may hold, reserve, or delay payout funds under certain conditions.',
      'PayPal Policy Pipeline Test Source',
      source.url
    ]
  );

  // Survival Note
  await q(
    `insert into survival_notes (red_flag_id, note_title, note_body, priority, status)
     values ($1, $2, $3, 'high', 'published')`,
    [
      redFlag.id,
      'Prepare payout backup before relying on PayPal',
      'Keep backup payment rails and maintain identity documents before a limitation or review happens.'
    ]
  );

  // Backup Option
  await q(
    `insert into backup_options (platform_id, red_flag_id, label, option_type, summary, tradeoffs, difficulty, cost_level, status)
     values ($1, $2, $3, $4, $5, $6, $7, $8, 'published')`,
    [
      platform.id,
      redFlag.id,
      'Wise or Payoneer',
      'alternative_platform',
      'Alternative payout route for eligible users.',
      'Availability, verification, supported countries, and fees vary by account and region.',
      'medium',
      'variable'
    ]
  );

  // Checklist
  const [checklist] = await q(
    `insert into checklists (platform_id, red_flag_id, title, status)
     values ($1, $2, $3, 'published') returning id`,
    [
      platform.id,
      redFlag.id,
      'PayPal Survival Checklist'
    ]
  );

  // Checklist Item
  await q(
    `insert into checklist_items (checklist_id, label, required, status)
     values ($1, $2, true, 'published')`,
    [
      checklist.id,
      'Keep identity documents, invoices, transaction history, and at least one backup payout method ready.'
    ]
  );

  console.log("✓ evidence/notes/backup/checklist added");

  // 9. Evaluate Draft Red Flag Quality Gate
  async function testEvaluateQuality(redFlagId) {
    const [rf] = await q(`SELECT * FROM red_flags WHERE id = $1`, [redFlagId]);
    const evidenceList = await q(`SELECT * FROM evidence WHERE red_flag_id = $1 AND status != 'archived'`, [redFlagId]);
    const notesList = await q(`SELECT * FROM survival_notes WHERE red_flag_id = $1 AND status != 'archived'`, [redFlagId]);
    
    const checklistsList = await q(`SELECT * FROM checklists WHERE red_flag_id = $1 AND status != 'archived'`, [redFlagId]);
    const checklistIds = checklistsList.map(c => c.id);
    const items = checklistIds.length > 0 
      ? await q(`SELECT * FROM checklist_items WHERE checklist_id = ANY($1) AND status != 'archived'`, [checklistIds])
      : [];

    const errors = [];
    if (!rf.platform_id) errors.push("Missing Platform");
    if (!rf.category) errors.push("Missing Category");
    if (!rf.reviewed_at) errors.push("Missing Review Date");
    if (!rf.source_id) errors.push("Missing Source");
    if (evidenceList.length === 0) errors.push("Missing Evidence: At least one evidence record is required");
    if (notesList.length === 0) errors.push("Missing Notes: At least one survival note is required");
    if (items.length === 0) errors.push("Missing Checklist: At least one checklist item is required");
    if (rf.summary && rf.summary.length < 50) errors.push("Too Short Summary: Summary should be at least 50 characters");

    return { ready_for_publish: errors.length === 0, errors };
  }

  const rfQuality = await testEvaluateQuality(redFlag.id);
  if (!rfQuality.ready_for_publish) {
    console.error("FAIL: Red flag quality check failed!", rfQuality.errors);
    process.exit(1);
  }
  console.log("✓ red flag quality ready_for_publish=true");

  // 10. Create Survival Page
  const [survivalPage] = await q(
    `insert into platform_survival_pages (platform_id, slug, title, summary, disclaimer_note, status, last_reviewed_at)
     values ($1, $2, $3, $4, $5, 'draft', now()) returning id`,
    [
      platform.id,
      'paypal-policy-pipeline-test',
      'PayPal Survival Page',
      'PayPal Survival Page summary.',
      'The information on this page is for general survival awareness.'
    ]
  );
  console.log("✓ survival page composed");

  // 11. Attach Red Flag
  await q(
    `insert into platform_survival_page_red_flags (page_id, red_flag_id, display_order)
     values ($1, $2, 0)`,
    [survivalPage.id, redFlag.id]
  );

  // 12. Evaluate Survival Page
  async function testEvaluatePage(pageId) {
    const [page] = await q(`SELECT * FROM platform_survival_pages WHERE id = $1`, [pageId]);
    const platformRow = await q(`SELECT * FROM platforms WHERE id = $1`, [page.platform_id]);
    const pageRedFlags = await q(`SELECT * FROM platform_survival_page_red_flags WHERE page_id = $1`, [pageId]);
    
    const errors = [];
    if (!platformRow || platformRow.length === 0) errors.push("Missing Platform");
    if (!page.title) errors.push("Missing Title");
    if (!page.disclaimer_note) errors.push("Missing Disclaimer Note");
    if (!page.last_reviewed_at) errors.push("Missing Last Reviewed Date");
    
    if (pageRedFlags.length === 0) {
      errors.push("Missing Red Flags: At least one red flag must be attached");
    }

    for (const prf of pageRedFlags) {
      const rfEval = await testEvaluateQuality(prf.red_flag_id);
      if (!rfEval.ready_for_publish) {
        errors.push(`Attached Red Flag "${prf.red_flag_id}" is not ready for publish: ${rfEval.errors.join(", ")}`);
      }
    }
    
    return { ready_for_publish: errors.length === 0, errors, count: pageRedFlags.length };
  }

  const pageEval = await testEvaluatePage(survivalPage.id);
  if (!pageEval.ready_for_publish) {
    console.error("FAIL: Survival page evaluation failed!", pageEval.errors);
    process.exit(1);
  }

  await q(
    `update platform_survival_pages set ready_for_publish=true, status='ready_for_publish' where id=$1`,
    [survivalPage.id]
  );
  console.log("✓ page quality ready_for_publish=true");

  // 13. Negative test (detach)
  await q(
    `delete from platform_survival_page_red_flags where page_id=$1 and red_flag_id=$2`,
    [survivalPage.id, redFlag.id]
  );

  const pageEvalNegative = await testEvaluatePage(survivalPage.id);
  if (pageEvalNegative.ready_for_publish) {
    console.error("FAIL: Page should not be ready_for_publish after detaching red flag!");
    process.exit(1);
  }
  console.log("✓ negative detach test passed");

  // Reattach and restore page state
  await q(
    `insert into platform_survival_page_red_flags (page_id, red_flag_id, display_order)
     values ($1, $2, 0)`,
    [survivalPage.id, redFlag.id]
  );
  await q(
    `update platform_survival_pages set ready_for_publish=true, status='ready_for_publish' where id=$1`,
    [survivalPage.id]
  );
  console.log("✓ restored page state");

  console.log("\n==========================================");
  console.log("PAYPAL POLICY PIPELINE TEST\n");
  console.log("✓ schema applied");
  console.log("✓ platform ready");
  console.log("✓ source ready");
  console.log("✓ snapshot created");
  console.log(`✓ scanner found ${scanResult1.matchesInserted} matches`);
  console.log(`✓ scanner created/reused ${scanResult1.candidatesCreated} candidates`);
  console.log("✓ scanner rerun dedupe OK");
  console.log("✓ candidate approved");
  console.log("✓ draft red flag created");
  console.log("✓ evidence/notes/backup/checklist added");
  console.log("✓ red flag quality ready_for_publish=true");
  console.log("✓ survival page composed");
  console.log("✓ page quality ready_for_publish=true");
  console.log("✓ negative detach test passed");
  console.log("✓ restored page state");
  console.log("==========================================");

  await pool.end();
}

main().catch((err) => {
  console.error("E2E Test failed:", err);
  process.exit(1);
});
