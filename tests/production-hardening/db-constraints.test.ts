import assert from "node:assert/strict";
import test from "node:test";

import {
  applyCanonicalPolibrawlSchema,
  createPolibrawlClient,
  loadStandardEnvFiles,
} from "../../scripts/lib/polibrawl-db.mjs";

type TransactionClient = {
  connect(): Promise<void>;
  end(): Promise<void>;
  query<T = { id: string }>(text: string, values?: unknown[]): Promise<{ rows: T[] }>;
};

let databaseReady = false;

test.before(async () => {
  await loadStandardEnvFiles();

  try {
    const client = createPolibrawlClient();
    await client.connect();
    await applyCanonicalPolibrawlSchema(client);
    await client.end();
    databaseReady = true;
  } catch {
    databaseReady = false;
  }
});

async function withRollback(assertion: (client: TransactionClient) => Promise<void>) {
  if (!databaseReady) {
    test.skip("DATABASE_URL is not available for integration constraint checks.");
    return;
  }

  const client = createPolibrawlClient() as TransactionClient;
  await client.connect();

  try {
    await client.query("BEGIN");
    await assertion(client);
  } finally {
    await client.query("ROLLBACK");
    await client.end();
  }
}

async function insertTempPlatform(client: TransactionClient) {
  const result = await client.query<{ id: string }>(
    `insert into platforms (
      slug,
      name,
      category,
      status,
      website_url,
      summary,
      main_level,
      disclaimer_text,
      internal_notes,
      last_reviewed_at,
      published_at
    ) values (
      $1, $2, 'payment', 'draft', $3, $4, 'high', null, null, now(), null
    ) returning id`,
    [
      `qa-temp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      "QA temp platform",
      "https://example.com",
      "Temporary QA summary for constraint verification that should never leave the transaction.",
    ],
  );

  return result.rows[0].id;
}

test("published dependency score uniqueness is enforced", async () => {
  await withRollback(async (client) => {
    const platformId = await insertTempPlatform(client);

    await client.query(
      `insert into dependency_scores (
        platform_id,
        score,
        risk_level,
        factors,
        explanation,
        generated_at,
        status,
        published_at
      ) values ($1, 70, 'high', $2, $3, now(), 'published', now())`,
      [platformId, ["Primary payment rail"], "First published dependency score."],
    );

    await assert.rejects(
      client.query(
        `insert into dependency_scores (
          platform_id,
          score,
          risk_level,
          factors,
          explanation,
          generated_at,
          status,
          published_at
        ) values ($1, 80, 'critical', $2, $3, now(), 'published', now())`,
        [platformId, ["No backup rail"], "Second published dependency score."],
      ),
      /duplicate key value violates unique constraint/i,
    );
  });
});

test("published evidence confidence uniqueness is enforced", async () => {
  await withRollback(async (client) => {
    const platformId = await insertTempPlatform(client);

    await client.query(
      `insert into evidence_confidence (
        platform_id,
        score,
        factors,
        last_verified_at,
        status,
        published_at
      ) values ($1, 80, $2, now(), 'published', now())`,
      [platformId, ["Official agreement"]],
    );

    await assert.rejects(
      client.query(
        `insert into evidence_confidence (
          platform_id,
          score,
          factors,
          last_verified_at,
          status,
          published_at
        ) values ($1, 85, $2, now(), 'published', now())`,
        [platformId, ["Current source"]],
      ),
      /duplicate key value violates unique constraint/i,
    );
  });
});

test("user platform watchlist prevents duplicate follows", async () => {
  await withRollback(async (client) => {
    const platformId = await insertTempPlatform(client);
    const userId = "00000000-0000-0000-0000-000000000111";

    await client.query(
      `insert into user_platform_watchlist (user_id, platform_id)
       values ($1, $2)`,
      [userId, platformId],
    );

    await assert.rejects(
      client.query(
        `insert into user_platform_watchlist (user_id, platform_id)
         values ($1, $2)`,
        [userId, platformId],
      ),
      /duplicate key value violates unique constraint/i,
    );
  });
});
