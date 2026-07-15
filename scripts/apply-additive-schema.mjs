import fs from "node:fs";
import path from "node:path";

import {
  applyTrackedMigrationFile,
  createPolibrawlClient,
  loadStandardEnvFiles,
  resolveRepoPath,
} from "./lib/polibrawl-db.mjs";

await loadStandardEnvFiles();

const requestedFile = process.argv[2] ?? "scripts/sql/add-research-packets.sql";
const resolvedPath = path.isAbsolute(requestedFile)
  ? requestedFile
  : resolveRepoPath(requestedFile);

if (!fs.existsSync(resolvedPath)) {
  console.error(`SQL file not found: ${resolvedPath}`);
  process.exit(1);
}

const client = createPolibrawlClient();

try {
  await client.connect();
  const result = await applyTrackedMigrationFile(client, resolvedPath);
  console.log(
    result.applied
      ? `Migration applied successfully: ${result.name}`
      : `Migration already recorded, nothing applied: ${result.name}`,
  );
} finally {
  await client.end();
}
