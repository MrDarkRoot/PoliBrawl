import fs from "node:fs/promises";
import path from "node:path";
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
      if (!trimmed || trimmed.startsWith("#")) continue;
      const sep = trimmed.indexOf("=");
      if (sep === -1) continue;
      const key = trimmed.slice(0, sep).trim();
      if (key in process.env) continue;
      let val = trimmed.slice(sep + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  } catch {
    // Ignored
  }
}

await loadEnvFile(".env.local");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("No DATABASE_URL found.");
  process.exit(1);
}

const client = new pg.Client({ connectionString });

async function main() {
  await client.connect();

  console.log("Dropping existing tables to clean database...");
  await client.query(`
    DROP SCHEMA public CASCADE;
    CREATE SCHEMA public;
    GRANT ALL ON SCHEMA public TO public;
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  `);

  console.log("Reading schema.polibrawl.sql...");
  const schemaPath = path.resolve(__dirname, "..", "schema.polibrawl.sql");
  const sql = await fs.readFile(schemaPath, "utf8");

  const statements = [];
  let currentStatement = "";
  let inDollarQuote = false;
  
  const lines = sql.split("\n");
  for (const line of lines) {
    if (line.includes("$$")) {
      inDollarQuote = !inDollarQuote;
    }
    currentStatement += line + "\n";
    if (!inDollarQuote && line.trim().endsWith(";")) {
      statements.push(currentStatement.trim());
      currentStatement = "";
    }
  }
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }

  console.log(`Parsed ${statements.length} SQL statements. Running with global auto-retry dependency resolver...`);

  let queue = [...statements];
  let lastQueueLength = queue.length + 1;
  let pass = 1;

  while (queue.length > 0 && queue.length < lastQueueLength) {
    console.log(`Pass ${pass}: executing remaining ${queue.length} statements...`);
    lastQueueLength = queue.length;
    const nextQueue = [];

    for (const stmt of queue) {
      if (!stmt) continue;
      const executableStmt = stmt.replace(/alter\s+table\s+if\s+exists/i, 'alter table');
      try {
        await client.query(executableStmt);
      } catch (err) {
        // Retry if error is "relation does not exist" (42P01) or "function does not exist" (42883)
        // or trigger-related dependency issue
        if (err.code === '42P01' || err.code === '42883') {
          nextQueue.push(stmt);
        } else {
          // Ignore "extension already exists" or "relation already exists" errors
          if (err.code === '42710' || err.code === '42723') {
            continue;
          }
          console.error("Statement failed with fatal error:", executableStmt);
          throw err;
        }
      }
    }
    queue = nextQueue;
    pass++;
  }

  if (queue.length > 0) {
    console.error(`\nDependency loop detected. ${queue.length} statements failed to execute:`);
    for (const stmt of queue) {
      console.error(" - Failed:", stmt);
    }
    throw new Error("Could not resolve dependencies for all statements.");
  }

  console.log("\nschema.polibrawl.sql applied successfully!");
}

main()
  .catch(err => {
    console.error("Schema application failed:", err);
    process.exit(1);
  })
  .finally(() => client.end());
