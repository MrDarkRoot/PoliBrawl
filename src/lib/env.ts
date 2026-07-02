import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  EDITORIAL_SITE_URL: z.string().url().optional(),
  DEV_BOOTSTRAP_OWNER_EMAILS: z.string().optional(),
});

const publicEnvSchema = envSchema.pick({
  NEXT_PUBLIC_SUPABASE_URL: true,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: true,
});

export function getSupabasePublicEnv() {
  const data = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
  const result = publicEnvSchema.safeParse(data);
  return result.success ? result.data : null;
}

export function getServerEnv() {
  const result = envSchema.safeParse(process.env);
  return result.success ? result.data : null;
}

export function hasSupabaseEnv() {
  return Boolean(getSupabasePublicEnv());
}

export function getBootstrapOwnerEmails() {
  const env = getServerEnv();
  if (!env?.DEV_BOOTSTRAP_OWNER_EMAILS) {
    return [];
  }

  return env.DEV_BOOTSTRAP_OWNER_EMAILS.split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}
