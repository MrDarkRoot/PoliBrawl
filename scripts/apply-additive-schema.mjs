import fs from "node:fs";
import { Client } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is required to apply additive schema");
  process.exit(1);
}
const sql = fs.readFileSync("scripts/sql/additive_acquisition.sql", "utf-8");

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  await client.query(sql);
  console.log("Migration applied successfully.");
  await client.end();
}

main().catch(console.error);
