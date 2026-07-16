import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import pg from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const additiveMigrationsDir = path.resolve(repoRoot, "scripts", "sql");
const baselineSchemaPath = path.resolve(repoRoot, "schema.polibrawl.sql");
const migrationJournalTable = "polibrawl_schema_migrations";

export const requiredPolibrawlTables = [
  "platforms",
  "red_flags",
  "sources",
  "source_snapshots",
  "resolution_routes",
  "dependency_scores",
  "risk_timelines",
  "evidence_confidence",
  "policy_changes",
  "user_platform_watchlist",
  "policy_alerts",
  "editorial_drafts",
  // Sprint 10.5 — Editorial Intelligence Calibration
  "editorial_draft_revisions",
];

async function loadEnvFile(filename) {
  const envPath = path.resolve(repoRoot, filename);

  try {
    const contents = await fs.readFile(envPath, "utf8");

    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      if (!key || key in process.env) {
        continue;
      }

      let value = trimmed.slice(separatorIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return;
    }

    throw error;
  }
}

export async function loadStandardEnvFiles() {
  await loadEnvFile(".env.local");
  await loadEnvFile(".env");
}

export function getPolibrawlConnectionString() {
  const connectionString =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.SUPABASE_DB_URL;

  if (!connectionString) {
    throw new Error(
      "Set DATABASE_URL, POSTGRES_URL, or SUPABASE_DB_URL before running PoliBrawl database operations.",
    );
  }

  return connectionString;
}

function shouldUseSsl(rawConnectionString) {
  const parsed = new URL(rawConnectionString);

  return (
    /supabase\.(co|com)$/.test(parsed.hostname) ||
    /\.supabase\.(co|com)$/.test(parsed.hostname) ||
    /pooler\.supabase\.com$/.test(parsed.hostname)
  );
}

export function toClientConfig(rawConnectionString) {
  const parsed = new URL(rawConnectionString);

  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 5432,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
    ssl: shouldUseSsl(rawConnectionString)
      ? {
          rejectUnauthorized: false,
        }
      : undefined,
  };
}

export function createPolibrawlClient() {
  return new pg.Client(toClientConfig(getPolibrawlConnectionString()));
}

export function getBaselineSchemaPath() {
  return baselineSchemaPath;
}

export async function listAdditiveMigrationFiles() {
  const entries = await fs.readdir(additiveMigrationsDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => path.resolve(additiveMigrationsDir, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

export function resolveRepoPath(relativePath) {
  return path.resolve(repoRoot, relativePath);
}

async function readSqlFile(filePath) {
  return fs.readFile(filePath, "utf8");
}

function getChecksum(sql) {
  return crypto.createHash("sha256").update(sql).digest("hex");
}

async function ensureMigrationJournal(client) {
  await client.query(
    `create table if not exists ${migrationJournalTable} (
      name text primary key,
      checksum text not null,
      applied_at timestamptz not null default now()
    )`,
  );
}

async function getRecordedMigration(client, name) {
  const result = await client.query(
    `select checksum from ${migrationJournalTable} where name = $1 limit 1`,
    [name],
  );

  return result.rows[0] ?? null;
}

export async function applyTrackedMigrationFile(client, filePath) {
  await ensureMigrationJournal(client);

  const sql = await readSqlFile(filePath);
  const checksum = getChecksum(sql);
  const name = path.relative(repoRoot, filePath);
  const existing = await getRecordedMigration(client, name);

  if (existing) {
    if (existing.checksum !== checksum) {
      throw new Error(
        `Tracked migration checksum mismatch for ${name}. Refuse to continue until the migration history is reconciled.`,
      );
    }

    return { applied: false, name };
  }

  await client.query("BEGIN");

  try {
    await client.query(sql);
    await client.query(
      `insert into ${migrationJournalTable} (name, checksum) values ($1, $2)`,
      [name, checksum],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw new Error(
      `Failed while applying tracked migration ${name}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return { applied: true, name };
}

export async function applyBaselineSchema(client) {
  const sql = await readSqlFile(baselineSchemaPath);

  try {
    await client.query(sql);
  } catch (error) {
    throw new Error(
      `Failed while applying schema.polibrawl.sql: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export async function applyCanonicalPolibrawlSchema(client) {
  await applyBaselineSchema(client);

  const migrations = await listAdditiveMigrationFiles();
  const results = [];

  for (const migrationPath of migrations) {
    results.push(await applyTrackedMigrationFile(client, migrationPath));
  }

  return results;
}

export async function getPolibrawlSchemaHealth(client, requiredTables) {
  const result = await client.query(
    `select table_name
     from information_schema.tables
     where table_schema = 'public'`,
  );

  const existingTables = result.rows.map((row) => row.table_name);
  const existing = new Set(existingTables.map((table) => table.toLowerCase()));
  const missingTables = requiredTables.filter((table) => !existing.has(table));

  return {
    existingTables,
    missingTables,
    healthy: missingTables.length === 0,
  };
}
