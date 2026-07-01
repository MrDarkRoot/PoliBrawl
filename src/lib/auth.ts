import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { hasSupabaseEnv, getBootstrapOwnerEmails } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AdminRole, Profile } from "@/types/domain";

type AuthContext =
  | {
      kind: "configured";
      user: User;
      profile: Profile;
    }
  | {
      kind: "missing-env";
    };

async function ensureProfile(user: User) {
  const adminClient = createAdminSupabaseClient();

  const { data: existing, error: existingError } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return existing;
  }

  const ownerEmails = getBootstrapOwnerEmails();
  const fallbackRole: AdminRole =
    ownerEmails.includes(user.email?.toLowerCase() ?? "") ? "owner" : "viewer";

  const { data, error } = await adminClient
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? null,
        username: user.user_metadata?.user_name ?? user.email ?? null,
        role: fallbackRole,
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getAuthContext(): Promise<AuthContext> {
  if (!hasSupabaseEnv()) {
    return { kind: "missing-env" };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await ensureProfile(user);

  return {
    kind: "configured",
    user,
    profile,
  };
}

export async function requireAdminAccess() {
  const context = await getAuthContext();

  if (context.kind === "missing-env") {
    return context;
  }

  if (context.profile.role === "viewer") {
    redirect("/login?error=role");
  }

  return context;
}
