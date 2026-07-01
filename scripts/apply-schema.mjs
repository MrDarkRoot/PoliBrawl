import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import pg from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const client = new pg.Client({
  connectionString,
  ssl: connectionString.includes("supabase.co")
    ? {
        rejectUnauthorized: false,
      }
    : undefined,
});

try {
  await client.connect();
  await client.query(sql);
  console.log("schema.sql applied successfully.");
} finally {
  await client.end();
}
