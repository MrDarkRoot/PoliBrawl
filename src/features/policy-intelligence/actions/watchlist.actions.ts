"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthContext } from "@/lib/auth";
import {
  deleteUserPlatformWatch,
  createUserPlatformWatch,
} from "@/server/polibrawl/repositories/user-platform-watchlist.repository";
import { findPlatformById } from "@/server/polibrawl/repositories/platform.repository";
import {
  markAllPolicyAlertsRead,
  markPolicyAlertRead,
} from "@/server/polibrawl/repositories/policy-alert.repository";
import { isPlatformPubliclyReady } from "@/server/polibrawl/services/platform-publication-readiness.service";
import { syncPolicyAlertsForUser } from "@/server/polibrawl/services/policy-intelligence.service";

function normalizeRedirectTarget(rawValue: FormDataEntryValue | null, fallback: string) {
  const value = typeof rawValue === "string" ? rawValue.trim() : "";

  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

async function requireSignedInUser(redirectTo: string) {
  const auth = await getAuthContext();

  if (auth.kind !== "configured") {
    redirect(`/login?next=${encodeURIComponent(redirectTo)}`);
  }

  return auth;
}

async function requirePublicPlatform(platformId: string) {
  const platform = await findPlatformById(platformId);

  if (!platform || platform.status !== "published" || platform.archived_at) {
    throw new Error("Platform is not available for watchlist actions.");
  }

  if (!(await isPlatformPubliclyReady(platform.id))) {
    throw new Error("Platform is not ready for public watchlist actions.");
  }

  return platform;
}

export async function addPlatformToWatchlistAction(formData: FormData) {
  const platformId = String(formData.get("platform_id") ?? "");
  const redirectTo = normalizeRedirectTarget(formData.get("redirect_to"), "/dashboard");

  if (!platformId) {
    throw new Error("Platform id is required.");
  }

  const auth = await requireSignedInUser(redirectTo);
  const platform = await requirePublicPlatform(platformId);

  await createUserPlatformWatch(auth.user.id, platformId);
  await syncPolicyAlertsForUser(auth.user.id, [platformId]);

  revalidatePath("/dashboard");
  revalidatePath("/changes");
  if (platform.slug) {
    revalidatePath(`/platforms/${platform.slug}`);
  }
  revalidatePath(redirectTo);
  redirect(redirectTo);
}

export async function removePlatformFromWatchlistAction(formData: FormData) {
  const platformId = String(formData.get("platform_id") ?? "");
  const redirectTo = normalizeRedirectTarget(formData.get("redirect_to"), "/dashboard");

  if (!platformId) {
    throw new Error("Platform id is required.");
  }

  const auth = await requireSignedInUser(redirectTo);
  const platform = await findPlatformById(platformId);

  await deleteUserPlatformWatch(auth.user.id, platformId);

  revalidatePath("/dashboard");
  if (platform?.slug) {
    revalidatePath(`/platforms/${platform.slug}`);
  }
  revalidatePath(redirectTo);
  redirect(redirectTo);
}

export async function markPolicyAlertReadAction(formData: FormData) {
  const alertId = String(formData.get("alert_id") ?? "");
  const redirectTo = normalizeRedirectTarget(formData.get("redirect_to"), "/dashboard");

  if (!alertId) {
    throw new Error("Alert id is required.");
  }

  const auth = await requireSignedInUser(redirectTo);
  await markPolicyAlertRead(auth.user.id, alertId);

  revalidatePath("/dashboard");
  revalidatePath(redirectTo);
  redirect(redirectTo);
}

export async function markAllPolicyAlertsReadAction(formData: FormData) {
  const redirectTo = normalizeRedirectTarget(formData.get("redirect_to"), "/dashboard");
  const auth = await requireSignedInUser(redirectTo);

  await markAllPolicyAlertsRead(auth.user.id);

  revalidatePath("/dashboard");
  revalidatePath(redirectTo);
  redirect(redirectTo);
}
