import { config } from "dotenv";
config({ path: ".env.local" });

import { queryOne } from "../src/server/polibrawl/db";
import { acquireSourceSnapshot } from "../src/server/polibrawl/services/source-acquisition/source-acquisition.service";
import { detectBotChallenge } from "../src/server/polibrawl/services/source-acquisition/source-acquisition-security";

async function main() {
  // First, find or create a dummy source
  let platformId = await queryOne<{ id: string }>("select id from platforms limit 1").then(r => r?.id);
  if (!platformId) {
    platformId = await queryOne<{ id: string }>(`insert into platforms (slug, name, category, status, website_url) values ('test-acq', 'Test Acq', 'payment', 'published', 'https://example.com') returning id`).then(r => r!.id);
  }

  let sourceId = await queryOne<{ id: string }>("select id from sources limit 1").then(r => r?.id);
  if (!sourceId) {
    sourceId = await queryOne<{ id: string }>(`insert into sources (platform_id, source_type, priority, title, url, status) values ('${platformId}', 'terms', 'core', 'Test Source', 'https://example.com', 'active') returning id`).then(r => r!.id);
  }

  console.log("Using source_id:", sourceId);

  console.log("\\n--- 1. HTTP Success ---");
  try {
    const res = await acquireSourceSnapshot({
      sourceId,
      method: "http",
      url: "https://example.com",
    });
    console.log("HTTP Success:", res.status === "succeeded", "extractedTextLength:", res.extractedTextLength);
  } catch (err) {
    console.error(err);
  }

  console.log("\\n--- 2. Blocked internal URL ---");
  try {
    const res = await acquireSourceSnapshot({
      sourceId,
      method: "http",
      url: "http://127.0.0.1",
    });
    console.log("Blocked:", res.status === "needs_manual_capture", "error:", res.error);
  } catch (err) {
    console.error(err);
  }

  console.log("\\n--- 3. Challenge detection ---");
  try {
    const isBot = detectBotChallenge("Checking your browser before accessing example.com");
    console.log("Detected bot challenge:", isBot);
  } catch (err) {
    console.error(err);
  }

  console.log("\\n--- 4. Upload Text ---");
  try {
    const res = await acquireSourceSnapshot({
      sourceId,
      method: "upload_text",
      uploadedContent: "This is a simple text upload test.",
      uploadedFilename: "test.txt",
    });
    console.log("Upload Text Success:", res.status === "succeeded", "extractedTextLength:", res.extractedTextLength);
  } catch (err) {
    console.error(err);
  }

  console.log("\\n--- 5. Upload HTML ---");
  try {
    const res = await acquireSourceSnapshot({
      sourceId,
      method: "upload_html",
      uploadedContent: "<html><head><title>Test Title</title></head><body><script>alert('noise');</script><main>Clean Text</main></body></html>",
      uploadedFilename: "test.html",
    });
    console.log("Upload HTML Success:", res.status === "succeeded", "extractedTextLength:", res.extractedTextLength);
  } catch (err) {
    console.error(err);
  }

  console.log("\\n--- 6. Auto mode ---");
  try {
    const res = await acquireSourceSnapshot({
      sourceId,
      method: "auto",
      url: "https://example.com",
    });
    console.log("Auto Success:", res.status === "succeeded", "methodUsed:", res.methodUsed);
  } catch (err) {
    console.error(err);
  }
  
  console.log("\\n--- 7. Browser capture ---");
  try {
    const res = await acquireSourceSnapshot({
      sourceId,
      method: "browser",
      url: "https://example.com",
    });
    console.log("Browser Success:", res.status === "succeeded" || res.status === "needs_manual_capture");
    console.log("Browser Details:", res.status, res.error);
  } catch (err) {
    console.error(err);
  }

  process.exit(0);
}

main();
