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
  console.log(
    `schema.polibrawl.sql and additive migrations completed. Newly applied migrations: ${results.filter((result) => result.applied).length}.`,
  );
} finally {
  await client.end();
}
