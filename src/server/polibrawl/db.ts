import "server-only";

import { Pool, type QueryResultRow } from "pg";

let pool: Pool | null = null;

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

export async function queryMany<T extends QueryResultRow>(
  text: string,
  values: readonly unknown[] = [],
) {
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
