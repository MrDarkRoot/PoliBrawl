import fs from "node:fs";
import { Client } from "pg";
import path from "node:path";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is required to apply additive schema");
  process.exit(1);
}

// Accept a specific file as argument, or default to research packets
const sqlFile = process.argv[2] ?? "scripts/sql/add-research-packets.sql";
const resolvedPath = path.resolve(sqlFile);

if (!fs.existsSync(resolvedPath)) {
  console.error(`SQL file not found: ${resolvedPath}`);
  process.exit(1);
}

const sql = fs.readFileSync(resolvedPath, "utf-8");

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(sql);
    console.log(`Migration applied successfully: ${sqlFile}`);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
