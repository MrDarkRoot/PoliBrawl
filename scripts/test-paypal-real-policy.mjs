import pg from "pg";
import { readFileSync } from "fs";
import crypto from "crypto";
import { load } from "cheerio";

console.log("==========================================");
console.log("PayPal Real Policy Scanner Evaluation");
console.log("==========================================");

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

function normalizeWhitespace(value) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

async function main() {
  const platformSlug = "paypal-real-policy-test";
  const sourceTitle = "PayPal Real User Agreement";
  const url = "https://www.paypal.com/us/legalhub/useragreement-full";

  // Clean up old runs of this specific test if they exist
  const existingPlatforms = await q("select id from platforms where slug=$1", [platformSlug]);
  if (existingPlatforms.length > 0) {
    const platformId = existingPlatforms[0].id;
    await q(`delete from keyword_matches where platform_id=$1`, [platformId]);
    await q(`delete from red_flag_candidates where platform_id=$1`, [platformId]);
    await q(`delete from source_snapshots where source_id in (select id from sources where platform_id=$1)`, [platformId]);
    await q(`delete from sources where platform_id=$1`, [platformId]);
    await q(`delete from platforms where id=$1`, [platformId]);
  }

  // 1. Create/find Platform
  const [platform] = await q(
    `insert into platforms (name, slug, category, status, summary, main_level, disclaimer_text, website_url)
     values ($1, $2, $3, $4, $5, $6, $7, $8) returning id`,
    [
      'PayPal Real Policy Test Platform',
      platformSlug,
      'payment',
      'published',
      'PayPal Real Policy validation fixture',
      'medium',
      'PoliBrawl is independent and is not affiliated with, sponsored by, or endorsed by PayPal.',
      'https://www.paypal.com'
    ]
  );

  // 2. Create/find Source
  const [source] = await q(
    `insert into sources (platform_id, title, source_type, priority, status, url)
     values ($1, $2, $3, $4, $5, $6) returning id`,
    [
      platform.id,
      sourceTitle,
      'payment_terms',
      'core',
      'active',
      url
    ]
  );

  // 3. Fetch from PayPal URL
  console.log(`Fetching from: ${url}...`);
  let response;
  try {
    response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,text/plain;q=0.9,*/*;q=0.1",
      }
    });
  } catch (err) {
    console.error("Fetch request failed due to network error:", err.message);
    process.exit(1);
  }

  if (!response.ok) {
    console.error(`Fetch failed. HTTP status: ${response.status} ${response.statusText}`);
    process.exit(1);
  }

  const rawHtml = await response.text();
  console.log(`✓ successfully fetched PayPal page (${Buffer.byteLength(rawHtml, 'utf8')} bytes)`);

  // 4. Extract Text
  const $ = load(rawHtml);
  $("script, style, noscript, svg, nav, footer, header, aside, form, button, iframe").remove();
  const root = $("main").first().length ? $("main").first() : $("body");
  const extractedText = normalizeWhitespace(root.text());

  if (!extractedText || extractedText.length < 100) {
    console.error("Extracted text is empty or too short. May be blocked by bot protection.");
    process.exit(1);
  }

  const wordCount = extractedText.split(/\s+/).filter(Boolean).length;
  const byteSize = Buffer.byteLength(extractedText, "utf8");
  const textPreview = extractedText.slice(0, 200);
  const contentHash = crypto.createHash("sha256").update(extractedText).digest("hex");

  console.log(`Extracted Text Length: ${extractedText.length} characters`);
  console.log(`Word Count: ${wordCount} words`);

  // Create Snapshot
  const [snapshot] = await q(
    `insert into source_snapshots (source_id, capture_method, original_url, final_url, http_status, content_type, content_hash, extracted_text, text_preview, word_count, byte_size, capture_status, captured_at)
     values ($1, 'fetch', $2, $2, 200, 'text/html', $3, $4, $5, $6, $7, 'succeeded', now()) returning id`,
    [
      source.id,
      url,
      contentHash,
      extractedText,
      textPreview,
      wordCount,
      byteSize
    ]
  );

  // 5. Run Keyword Scanner
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
    money: "Potential Money Control Red Flag",
    account: "Potential Account Control Red Flag",
    kyc: "Potential Verification Red Flag",
    payout: "Potential Payout Red Flag",
    appeal: "Potential Appeal Clarity Red Flag",
    data_saas: "Potential Data or SaaS Continuity Red Flag",
    api: "Potential API Access Red Flag",
    legal: "Potential Legal Terms Red Flag",
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

  let totalMatches = 0;
  const matchDetails = [];

  for (const [category, keywords] of Object.entries(TAXONOMY)) {
    const matches = findMatches(extractedText, keywords);
    if (matches.length === 0) continue;

    const seenKeywords = new Set();
    const newMatchIds = [];

    for (const m of matches) {
      if (seenKeywords.has(m.keyword)) continue;
      seenKeywords.add(m.keyword);

      const excerpt = extractedText.slice(Math.max(0, m.start - 150), Math.min(extractedText.length, m.end + 150));
      const [row] = await q(
        `insert into keyword_matches
           (source_snapshot_id, source_id, platform_id, category, keyword, matched_text, excerpt,
            start_offset, end_offset, confidence, noise_score, status)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,1,0,'pending')
         returning id`,
        [snapshot.id, source.id, platform.id, category, m.keyword, extractedText.slice(m.start, m.end), excerpt, m.start, m.end],
      );
      newMatchIds.push(row.id);
      totalMatches++;
      matchDetails.push({ category, keyword: m.keyword });
    }

    if (newMatchIds.length === 0) continue;

    const [cand] = await q(
      `insert into red_flag_candidates
         (platform_id, source_id, source_snapshot_id, primary_keyword_match_id,
          category, headline, excerpt, matched_keywords, confidence_note, status)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')
       returning id`,
      [
        platform.id, source.id, snapshot.id, newMatchIds[0], category,
        SUGGESTED_TITLES[category] ?? "Red Flag Candidate",
        extractedText.slice(matches[0].start, matches[0].start + 350),
        [...seenKeywords],
        "Scanner level: medium",
      ],
    );

    for (const mid of newMatchIds) {
      await q(`update keyword_matches set candidate_id=$1, status='grouped' where id=$2`, [cand.id, mid]);
    }
  }

  // 6. Print Scanner Evaluation Report
  console.log("\n--- Top 20 Keyword Matches ---");
  const printedMatches = matchDetails.slice(0, 20);
  printedMatches.forEach((m, idx) => {
    console.log(`${idx + 1}. [${m.category}] Keyword: "${m.keyword}"`);
  });
  if (matchDetails.length > 20) {
    console.log(`... and ${matchDetails.length - 20} more matches.`);
  }

  const dbCandidates = await q(
    `select id, category, headline, excerpt, matched_keywords
     from red_flag_candidates where source_snapshot_id=$1`,
    [snapshot.id]
  );

  console.log("\n--- Candidates Created by Category ---");
  dbCandidates.forEach((c) => {
    console.log(`- Category: [${c.category}] - Keywords matched: [${c.matched_keywords.join(", ")}]`);
  });

  console.log("\n--- Candidate Excerpts ---");
  dbCandidates.forEach((c) => {
    console.log(`\n[${c.category.toUpperCase()}] ${c.headline}:`);
    console.log(`"${c.excerpt.trim().replace(/\n/g, " ").slice(0, 250)}..."`);
  });

  console.log("\n--- noise_score Summary ---");
  const dbMatches = await q(
    `select category, keyword, noise_score from keyword_matches where source_snapshot_id=$1`,
    [snapshot.id]
  );
  dbMatches.forEach((m) => {
    console.log(`- Match [${m.category}] "${m.keyword}": noise_score = ${m.noise_score ?? 0}`);
  });

  console.log("\n==========================================");
  console.log("PAYPAL REAL POLICY SCANNER EVALUATION SUMMARY\n");
  console.log(`- Real PayPal fetch worked: YES (HTTP ${response.status})`);
  console.log(`- Scanner matches count: ${totalMatches}`);
  console.log(`- Candidate count: ${dbCandidates.length}`);
  console.log(`- Categories found: ${dbCandidates.map(c => c.category).join(", ")}`);
  
  const isNoisy = totalMatches > 40;
  console.log(`- Scanner results look: ${isNoisy ? 'Noisy (Many matches found, requires manual vetting)' : 'Useful (Targeted and specific)'}`);
  console.log("==========================================");

  await pool.end();
}

main().catch((err) => {
  console.error("Evaluation failed:", err);
  process.exit(1);
});
