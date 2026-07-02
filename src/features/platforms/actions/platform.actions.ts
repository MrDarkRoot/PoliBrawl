"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminAccess } from "@/lib/auth";
import {
  archivePlatform,
  createPlatform,
  findPlatformById,
  updatePlatform,
} from "@/server/polibrawl/repositories/platform.repository";
import {
  createPlatformSchema,
  updatePlatformSchema,
} from "@/features/platforms/schemas/platform.schema";

export type PlatformActionState = {
  message: string | null;
  fieldErrors: Record<string, string[] | undefined>;
};

function normalizeNullableString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeOptionalDatetime(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? new Date(trimmed).toISOString() : null;
}

function platformInputFromFormData(formData: FormData) {
  return {
    name: formData.get("name"),
    slug: formData.get("slug"),
    category: formData.get("category"),
    website_url: formData.get("website_url"),
    summary: normalizeNullableString(formData.get("summary")),
    main_level: normalizeNullableString(formData.get("main_level")),
    status: formData.get("status"),
    internal_notes: normalizeNullableString(formData.get("internal_notes")),
    last_reviewed_at: normalizeOptionalDatetime(formData.get("last_reviewed_at")),
  };
}

function normalizeCreatePlatformInput(
  input: ReturnType<typeof createPlatformSchema.parse>,
) {
  return {
    ...input,
    summary: input.summary ?? null,
    main_level: input.main_level ?? null,
    disclaimer_text: input.disclaimer_text ?? null,
    internal_notes: input.internal_notes ?? null,
    last_reviewed_at: input.last_reviewed_at ?? null,
    published_at: input.published_at ?? null,
    archived_at: input.archived_at ?? null,
  };
}

function normalizeUpdatePlatformInput(
  input: ReturnType<typeof updatePlatformSchema.parse>,
) {
  const normalized: Record<string, unknown> = { ...input };

  for (const key of [
    "summary",
    "main_level",
    "disclaimer_text",
    "internal_notes",
    "last_reviewed_at",
    "published_at",
    "archived_at",
  ] as const) {
    if (key in normalized && normalized[key] === undefined) {
      delete normalized[key];
    }
  }

  return normalized;
}

function toActionState(message: string, fieldErrors: Record<string, string[] | undefined> = {}) {
  return {
    message,
    fieldErrors,
  } satisfies PlatformActionState;
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export async function createPlatformAction(
  _previousState: PlatformActionState,
  formData: FormData,
) {
  await requireAdminAccess();

  const parsed = createPlatformSchema.safeParse(platformInputFromFormData(formData));

  if (!parsed.success) {
    return toActionState(
      "Please correct the highlighted fields and try again.",
      parsed.error.flatten().fieldErrors,
    );
  }

  try {
    const platform = await createPlatform(normalizeCreatePlatformInput(parsed.data));
    revalidatePath("/admin");
    revalidatePath("/admin/platforms");
    redirect(`/admin/platforms/${platform.id}`);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return toActionState("A platform with that slug already exists.", {
        slug: ["A platform with that slug already exists."],
      });
    }

    return toActionState("Something went wrong while creating the platform.");
  }
}

export async function updatePlatformAction(
  platformId: string,
  _previousState: PlatformActionState,
  formData: FormData,
) {
  await requireAdminAccess();

  const existing = await findPlatformById(platformId);
  if (!existing) {
    return toActionState("Platform not found.");
  }

  const parsed = updatePlatformSchema.safeParse(platformInputFromFormData(formData));

  if (!parsed.success) {
    return toActionState(
      "Please correct the highlighted fields and try again.",
      parsed.error.flatten().fieldErrors,
    );
  }

  try {
    await updatePlatform(platformId, normalizeUpdatePlatformInput(parsed.data));
    revalidatePath("/admin");
    revalidatePath("/admin/platforms");
    revalidatePath(`/admin/platforms/${platformId}`);
    redirect(`/admin/platforms/${platformId}`);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return toActionState("A platform with that slug already exists.", {
        slug: ["A platform with that slug already exists."],
      });
    }

    return toActionState("Something went wrong while updating the platform.");
  }
}

export async function archivePlatformAction(formData: FormData) {
  await requireAdminAccess();

  const platformId = formData.get("platform_id");

  if (typeof platformId !== "string" || !platformId) {
    return;
  }

  await archivePlatform(platformId).catch(() => null);

  revalidatePath("/admin");
  revalidatePath("/admin/platforms");
  revalidatePath(`/admin/platforms/${platformId}`);
  redirect("/admin/platforms");
}
