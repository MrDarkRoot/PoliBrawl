import fs from "node:fs";
import { Client } from "pg";

const connectionString = "postgresql://analyst:changeme_dev@localhost:5432/polibrawl";
const sql = fs.readFileSync("scripts/sql/additive_acquisition.sql", "utf-8");

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  await client.query(sql);
  console.log("Migration applied successfully.");
  await client.end();
}

main().catch(console.error);
