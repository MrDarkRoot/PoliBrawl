import {
  createPolibrawlClient,
  getPolibrawlSchemaHealth,
  listAdditiveMigrationFiles,
  loadStandardEnvFiles,
  requiredPolibrawlTables,
  resolveRepoPath,
} from "./lib/polibrawl-db.mjs";

const requiredTrackedMigrations = [
  resolveRepoPath("scripts/sql/add-ai-editorial-worker-v1.sql"),
  resolveRepoPath("scripts/sql/add-platform-survival-intelligence-v1.sql"),
  resolveRepoPath("scripts/sql/add-policy-intelligence-retention-v1.sql"),
  resolveRepoPath("scripts/sql/add-production-hardening-v1.sql"),
  // Sprint 10.5 — Editorial Intelligence Calibration
  resolveRepoPath("scripts/sql/add-editorial-calibration-v1.sql"),
];

await loadStandardEnvFiles();

const additiveMigrations = await listAdditiveMigrationFiles();
const missingTrackedMigrations = requiredTrackedMigrations.filter(
  (migrationPath) => !additiveMigrations.includes(migrationPath),
);

if (missingTrackedMigrations.length > 0) {
  console.error(
    `PoliBrawl migration readiness check failed. Missing tracked migration files: ${missingTrackedMigrations.join(", ")}`,
  );
  process.exit(1);
}

const client = createPolibrawlClient();

try {
  await client.connect();
  const health = await getPolibrawlSchemaHealth(client, [...requiredPolibrawlTables]);

  if (!health.healthy) {
    console.error(
      `PoliBrawl migration readiness check failed. Missing required tables: ${health.missingTables.join(", ")}`,
    );
    process.exitCode = 1;
  } else {
    console.log("PoliBrawl migration readiness check passed.");
  }
} finally {
  await client.end();
}
