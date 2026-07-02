import { execSync } from "child_process";
import fs from "fs";
import path from "path";

console.log("==========================================");
console.log("Epic B Smoke Test Suite");
console.log("==========================================");

function runScript(scriptPath) {
  if (fs.existsSync(scriptPath)) {
    console.log(`\n--- Running ${path.basename(scriptPath)} ---`);
    try {
      execSync(`node ${scriptPath}`, { stdio: "inherit" });
    } catch {
      console.error(`\n❌ Failed at ${path.basename(scriptPath)}`);
      process.exit(1);
    }
  } else {
    console.log(`\n--- Skipping ${path.basename(scriptPath)} (not found) ---`);
  }
}

// 1. Apply Schema
runScript("scripts/apply-polibrawl-schema.mjs");

// 2. Sprint 4 Smoke Test
runScript("scripts/smoke-test-sprint4.mjs");

// 3. Sprint 5 Smoke Test
runScript("scripts/smoke-test-sprint5.mjs");

// 4. Sprint 6 Smoke Test
runScript("scripts/smoke-test-sprint6.mjs");

// 5. Sprint 6.5 Smoke Test
runScript("scripts/smoke-test-sprint65.mjs");

console.log("\n✅ Epic B Smoke Test Suite passed all checks.");
process.exit(0);
