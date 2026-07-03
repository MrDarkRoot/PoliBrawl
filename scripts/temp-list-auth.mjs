import pg from "pg";
import { readFileSync } from "fs";

function loadEnv() {
  try {
    const env = readFileSync(".env.local", "utf-8");
    for (const line of env.split("\n")) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    console.log("No .env.local file found.");
  }
}
loadEnv();

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query("SELECT id, email, encrypted_password FROM auth.users");
    console.log("AUTH USERS:", res.rows);
  } catch (err) {
    console.error("Error querying auth.users:", err);
  } finally {
    await pool.end();
  }
}
main();
