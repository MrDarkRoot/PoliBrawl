import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import pg from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadEnvFile(filename) {
  const envPath = path.resolve(__dirname, "..", filename);

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

await loadEnvFile(".env.local");
await loadEnvFile(".env");

const connectionString =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error(
    "Set DATABASE_URL, POSTGRES_URL, or SUPABASE_DB_URL before applying schema.sql.",
  );
  process.exit(1);
}

const schemaPath = path.resolve(__dirname, "..", "schema.sql");
const sql = await fs.readFile(schemaPath, "utf8");

function toClientConfig(rawConnectionString) {
  const parsed = new URL(rawConnectionString);
  const shouldUseSsl =
    /supabase\.(co|com)$/.test(parsed.hostname) ||
    /\.supabase\.(co|com)$/.test(parsed.hostname) ||
    /pooler\.supabase\.com$/.test(parsed.hostname);

  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 5432,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
    ssl: shouldUseSsl
      ? {
          rejectUnauthorized: false,
        }
      : undefined,
  };
}

const client = new pg.Client(toClientConfig(connectionString));

try {
  await client.connect();
  await client.query(sql);
  console.log("schema.sql applied successfully.");
} finally {
  await client.end();
}
