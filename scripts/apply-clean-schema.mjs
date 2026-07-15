import {
  applyCanonicalPolibrawlSchema,
  createPolibrawlClient,
  loadStandardEnvFiles,
} from "./lib/polibrawl-db.mjs";

await loadStandardEnvFiles();

const client = createPolibrawlClient();

try {
  await client.connect();
  await client.query(`
    DROP SCHEMA public CASCADE;
    CREATE SCHEMA public;
    GRANT ALL ON SCHEMA public TO public;
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  `);

  const results = await applyCanonicalPolibrawlSchema(client);
  console.log(
    `Clean PoliBrawl schema apply completed. Newly applied additive migrations: ${results.filter((result) => result.applied).length}.`,
  );
} finally {
  await client.end();
}
