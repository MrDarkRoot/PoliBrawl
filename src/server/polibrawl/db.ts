import "server-only";

import { Pool, type QueryResultRow } from "pg";
import {
  findMissingPolibrawlTables,
  requiredPolibrawlTables,
} from "@/server/polibrawl/schema-health.shared";

let pool: Pool | null = null;
let schemaHealthPromise: Promise<void> | null = null;
export { findMissingPolibrawlTables, requiredPolibrawlTables };

function getConnectionString() {
  const connectionString =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.SUPABASE_DB_URL;

  if (!connectionString) {
    throw new Error(
      "Set DATABASE_URL, POSTGRES_URL, or SUPABASE_DB_URL before using PoliBrawl repositories.",
    );
  }

  return connectionString;
}

function shouldUseSsl(connectionString: string) {
  const parsed = new URL(connectionString);

  return (
    /supabase\.(co|com)$/.test(parsed.hostname) ||
    /\.supabase\.(co|com)$/.test(parsed.hostname) ||
    /pooler\.supabase\.com$/.test(parsed.hostname)
  );
}

export function getPolibrawlPool() {
  if (!pool) {
    const connectionString = getConnectionString();

    pool = new Pool({
      connectionString,
      ssl: shouldUseSsl(connectionString)
        ? {
            rejectUnauthorized: false,
          }
        : undefined,
    });
  }

  return pool;
}

export async function getPolibrawlSchemaHealth() {
  const result = await getPolibrawlPool().query<{ table_name: string }>(
    `select table_name
     from information_schema.tables
     where table_schema = 'public'`,
  );

  const existingTables = result.rows.map((row) => row.table_name);
  const missingTables = findMissingPolibrawlTables(existingTables);

  return {
    existingTables,
    missingTables,
    healthy: missingTables.length === 0,
  };
}

export async function assertPolibrawlSchemaHealth() {
  if (!schemaHealthPromise) {
    schemaHealthPromise = (async () => {
      const health = await getPolibrawlSchemaHealth();

      if (!health.healthy) {
        throw new Error(
          `PoliBrawl database schema is incomplete. Missing required tables: ${health.missingTables.join(", ")}. Run the canonical schema migration flow before starting the application.`,
        );
      }
    })();
  }

  return schemaHealthPromise;
}

export async function queryMany<T extends QueryResultRow>(
  text: string,
  values: readonly unknown[] = [],
) {
  await assertPolibrawlSchemaHealth();
  const result = await getPolibrawlPool().query<T>(text, [...values]);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow>(
  text: string,
  values: readonly unknown[] = [],
) {
  const rows = await queryMany<T>(text, values);
  return rows[0] ?? null;
}
