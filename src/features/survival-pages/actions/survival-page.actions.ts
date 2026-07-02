"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAccess } from "@/lib/auth";
import {
  createSurvivalPageSchema,
  updateSurvivalPageSchema,
  attachRedFlagSchema
} from "../schemas/survival-page.schema";
import {
  createPlatformSurvivalPage,
  updatePlatformSurvivalPage,
  archivePlatformSurvivalPage
} from "@/server/polibrawl/repositories/platform-survival-page.repository";
import {
  addRedFlagToPage,
  removeRedFlagFromPage,
  reorderPageRedFlags
} from "@/server/polibrawl/repositories/platform-survival-page-red-flag.repository";
import {
  createDefaultSurvivalPageForPlatform,
  autoAttachReadyRedFlagsToPage,
  updatePageReadiness
} from "@/server/polibrawl/services/survival-page-composer.service";

export async function createSurvivalPageAction(prevState: unknown, formData: FormData): Promise<{ success: boolean; error: string | null; id?: string; }> {
  await requireAdminAccess();
  const parsed = createSurvivalPageSchema.safeParse({
    platformId: formData.get("platformId"),
    slug: formData.get("slug"),
    title: formData.get("title"),
    summary: formData.get("summary"),
    main_level: formData.get("main_level"),
    editorial_intro: formData.get("editorial_intro"),
    survival_summary: formData.get("survival_summary"),
    disclaimer_note: formData.get("disclaimer_note"),
    last_reviewed_at: formData.get("last_reviewed_at"),
  });
  if (!parsed.success) return { success: false, error: "Invalid data" };
  
  const page = await createPlatformSurvivalPage({
    platform_id: parsed.data.platformId,
    slug: parsed.data.slug,
    title: parsed.data.title,
    summary: parsed.data.summary || null,
    main_level: parsed.data.main_level || null,
    status: "draft",
    editorial_intro: parsed.data.editorial_intro || null,
    survival_summary: parsed.data.survival_summary || null,
    disclaimer_note: parsed.data.disclaimer_note || null,
    last_reviewed_at: parsed.data.last_reviewed_at || null,
    ready_for_publish: false,
  });
  
  revalidatePath(`/admin/survival-pages`);
  return { success: true, error: null, id: page.id };
}

export async function updateSurvivalPageAction(prevState: unknown, formData: FormData): Promise<{ success: boolean; error: string | null; }> {
  await requireAdminAccess();
  const parsed = updateSurvivalPageSchema.safeParse({
    id: formData.get("id"),
    slug: formData.get("slug"),
    title: formData.get("title"),
    summary: formData.get("summary"),
    main_level: formData.get("main_level"),
    editorial_intro: formData.get("editorial_intro"),
    survival_summary: formData.get("survival_summary"),
    disclaimer_note: formData.get("disclaimer_note"),
    last_reviewed_at: formData.get("last_reviewed_at"),
  });
  if (!parsed.success) return { success: false, error: "Invalid data" };
  
  await updatePlatformSurvivalPage(parsed.data.id, {
    slug: parsed.data.slug,
    title: parsed.data.title,
    summary: parsed.data.summary || null,
    main_level: parsed.data.main_level || null,
    editorial_intro: parsed.data.editorial_intro || null,
    survival_summary: parsed.data.survival_summary || null,
    disclaimer_note: parsed.data.disclaimer_note || null,
    last_reviewed_at: parsed.data.last_reviewed_at || null,
  });

  await updatePageReadiness(parsed.data.id);
  
  revalidatePath(`/admin/survival-pages/${parsed.data.id}`);
  return { success: true, error: null };
}

export async function archiveSurvivalPageAction(id: string) {
  await requireAdminAccess();
  await archivePlatformSurvivalPage(id);
  revalidatePath(`/admin/survival-pages`);
}

export async function attachRedFlagToPageAction(prevState: unknown, formData: FormData): Promise<{ success: boolean; error: string | null; }> {
  await requireAdminAccess();
  const parsed = attachRedFlagSchema.safeParse({
    pageId: formData.get("pageId"),
    redFlagId: formData.get("redFlagId"),
  });
  if (!parsed.success) return { success: false, error: "Invalid data" };

  await addRedFlagToPage(parsed.data.pageId, parsed.data.redFlagId);
  await updatePageReadiness(parsed.data.pageId);
  
  revalidatePath(`/admin/survival-pages/${parsed.data.pageId}`);
  return { success: true, error: null };
}

export async function detachRedFlagFromPageAction(pageId: string, redFlagId: string) {
  await requireAdminAccess();
  await removeRedFlagFromPage(pageId, redFlagId);
  await updatePageReadiness(pageId);
  revalidatePath(`/admin/survival-pages/${pageId}`);
}

export async function reorderPageRedFlagsAction(pageId: string, orderedRedFlagIds: string[]) {
  await requireAdminAccess();
  await reorderPageRedFlags(pageId, orderedRedFlagIds);
  revalidatePath(`/admin/survival-pages/${pageId}`);
}

export async function createDefaultSurvivalPageForPlatformAction(platformId: string) {
  await requireAdminAccess();
  const page = await createDefaultSurvivalPageForPlatform(platformId);
  revalidatePath(`/admin/survival-pages`);
  revalidatePath(`/admin/platforms/${platformId}/survival-page`);
  return page;
}

export async function autoAttachReadyRedFlagsAction(pageId: string) {
  await requireAdminAccess();
  await autoAttachReadyRedFlagsToPage(pageId);
  await updatePageReadiness(pageId);
  revalidatePath(`/admin/survival-pages/${pageId}`);
}

export async function updatePageReadinessAction(pageId: string) {
  await requireAdminAccess();
  await updatePageReadiness(pageId);
  revalidatePath(`/admin/survival-pages/${pageId}`);
}
