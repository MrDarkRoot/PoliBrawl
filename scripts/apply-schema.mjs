import {
  applyCanonicalPolibrawlSchema,
  createPolibrawlClient,
  loadStandardEnvFiles,
} from "./lib/polibrawl-db.mjs";

await loadStandardEnvFiles();

const client = createPolibrawlClient();

try {
  await client.connect();
  const results = await applyCanonicalPolibrawlSchema(client);
  const appliedCount = results.filter((result) => result.applied).length;
  const skippedCount = results.length - appliedCount;

  console.log(
    `PoliBrawl schema applied successfully. Additive migrations applied: ${appliedCount}. Skipped as already tracked: ${skippedCount}.`,
  );
} finally {
  await client.end();
}
