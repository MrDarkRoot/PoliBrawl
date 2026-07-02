import process from "node:process";

import { Pool } from "pg";

import type { PlatformCategory, PlatformStatus } from "../src/types/polibrawl";

type SeedPlatform = {
  slug: string;
  name: string;
  category: PlatformCategory;
  status: PlatformStatus;
  website_url: string;
  summary: string;
  disclaimer_text: string;
  internal_notes: string;
};

const seedPlatforms: SeedPlatform[] = [
  {
    slug: "wise",
    name: "Wise",
    category: "payment",
    status: "needs_review",
    website_url: "https://wise.com",
    summary: "Draft platform record for future PoliBrawl survival coverage.",
    disclaimer_text:
      "PoliBrawl is independent and is not affiliated with, sponsored by, or endorsed by Wise.",
    internal_notes: "Seeded for Epic B foundation only. No red flags or evidence included.",
  },
  {
    slug: "paypal",
    name: "PayPal",
    category: "payment",
    status: "needs_review",
    website_url: "https://www.paypal.com",
    summary: "Draft platform record for future PoliBrawl survival coverage.",
    disclaimer_text:
      "PoliBrawl is independent and is not affiliated with, sponsored by, or endorsed by PayPal.",
    internal_notes: "Seeded for Epic B foundation only. No red flags or evidence included.",
  },
  {
    slug: "github",
    name: "GitHub",
    category: "saas_developer",
    status: "needs_review",
    website_url: "https://github.com",
    summary: "Draft platform record for future PoliBrawl survival coverage.",
    disclaimer_text:
      "PoliBrawl is independent and is not affiliated with, sponsored by, or endorsed by GitHub.",
    internal_notes: "Seeded for Epic B foundation only. No red flags or evidence included.",
  },
];

function getConnectionString() {
  const connectionString =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.SUPABASE_DB_URL;

  if (!connectionString) {
    throw new Error(
      "Set DATABASE_URL, POSTGRES_URL, or SUPABASE_DB_URL before running seed-polibrawl.ts.",
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

async function main() {
  const connectionString = getConnectionString();
  const pool = new Pool({
    connectionString,
    ssl: shouldUseSsl(connectionString)
      ? {
          rejectUnauthorized: false,
        }
      : undefined,
  });

  try {
    for (const platform of seedPlatforms) {
      await pool.query(
        `
          insert into platforms (
            slug,
            name,
            category,
            status,
            website_url,
            summary,
            disclaimer_text,
            internal_notes
          ) values ($1, $2, $3, $4, $5, $6, $7, $8)
          on conflict (slug)
          do update set
            name = excluded.name,
            category = excluded.category,
            status = excluded.status,
            website_url = excluded.website_url,
            summary = excluded.summary,
            disclaimer_text = excluded.disclaimer_text,
            internal_notes = excluded.internal_notes,
            archived_at = null
        `,
        [
          platform.slug,
          platform.name,
          platform.category,
          platform.status,
          platform.website_url,
          platform.summary,
          platform.disclaimer_text,
          platform.internal_notes,
        ],
      );
    }

    console.log(`Seeded ${seedPlatforms.length} PoliBrawl platforms.`);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
