import {
  createPolibrawlClient,
  getPolibrawlSchemaHealth,
  loadStandardEnvFiles,
  requiredPolibrawlTables,
} from "./lib/polibrawl-db.mjs";

await loadStandardEnvFiles();

const client = createPolibrawlClient();

try {
  await client.connect();
  const health = await getPolibrawlSchemaHealth(client, [...requiredPolibrawlTables]);

  if (!health.healthy) {
    console.error(
      `PoliBrawl DB health check failed. Missing required tables: ${health.missingTables.join(", ")}`,
    );
    process.exitCode = 1;
  } else {
    console.log("PoliBrawl DB health check passed.");
  }
} finally {
  await client.end();
}
