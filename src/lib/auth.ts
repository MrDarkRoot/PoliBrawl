import "server-only";

import { forbidden, redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { evaluateAdminAccess, evaluateUserAccess } from "@/lib/auth-policy";
import { hasSupabaseEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/domain";

type AuthContext =
  | {
      kind: "configured";
      user: User;
      profile: Profile;
    }
  | {
      kind: "missing-env";
    };

type ConfiguredAuthContext = Extract<AuthContext, { kind: "configured" }>;

async function getProfile(user: User) {
  const adminClient = createAdminSupabaseClient();

  const { data: existing, error: existingError } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  return existing;
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

  const profile = await getProfile(user);
  const accessDecision = evaluateUserAccess({
    hasServerEnv: true,
    hasUser: Boolean(user),
    hasProfile: Boolean(profile),
  });

  if (!accessDecision.allowed) {
    redirect(
      accessDecision.reason === "unauthenticated" ? "/login" : "/login?error=role",
    );
  }

  if (!profile) {
    redirect("/login?error=role");
  }

  return {
    kind: "configured",
    user,
    profile,
  };
}

export async function getOptionalAuthContext(): Promise<
  | { kind: "configured"; user: User; profile: Profile }
  | { kind: "anonymous" }
  | { kind: "missing-env" }
> {
  if (!hasSupabaseEnv()) {
    return { kind: "missing-env" };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { kind: "anonymous" };
  }

  try {
    const profile = await getProfile(user);
    if (!profile) {
      return { kind: "anonymous" };
    }

    return {
      kind: "configured",
      user,
      profile,
    };
  } catch {
    return { kind: "anonymous" };
  }
}

export async function requireAdminAccess(): Promise<ConfiguredAuthContext> {
  const hasServerEnv = hasSupabaseEnv();

  if (!hasServerEnv) {
    forbidden();
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getProfile(user) : null;
  const accessDecision = evaluateAdminAccess({
    hasServerEnv,
    hasUser: Boolean(user),
    hasProfile: Boolean(profile),
    role: profile?.role,
  });

  if (!accessDecision.allowed || !user || !profile) {
    forbidden();
  }

  return {
    kind: "configured" as const,
    user,
    profile,
  };
}
