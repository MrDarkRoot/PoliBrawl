"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminAccess } from "@/lib/auth";
import {
  archiveSource,
  createSource,
  findSourceById,
  updateSource,
} from "@/server/polibrawl/repositories/source.repository";
import {
  captureSourceByFetch,
  captureSourceByPaste,
  SourceCaptureError,
} from "@/server/polibrawl/services/source-capture.service";
import {
  archiveSourceSchema,
  captureFetchSourceSchema,
  capturePasteSourceSchema,
  createSourceSchema,
  updateSourceSchema,
} from "@/features/sources/schemas/source.schema";

export type SourceActionState = {
  message: string | null;
  fieldErrors: Record<string, string[] | undefined>;
};

const initialSourceActionState: SourceActionState = {
  message: null,
  fieldErrors: {},
};

function toActionState(
  message: string,
  fieldErrors: Record<string, string[] | undefined> = {},
) {
  return {
    message,
    fieldErrors,
  } satisfies SourceActionState;
}

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

function sourceInputFromFormData(formData: FormData) {
  return {
    platform_id: formData.get("platform_id"),
    title: formData.get("title"),
    url: normalizeNullableString(formData.get("url")),
    source_type: formData.get("source_type"),
    priority: formData.get("priority"),
    status: formData.get("status"),
    notes: normalizeNullableString(formData.get("notes")),
    last_reviewed_at: normalizeOptionalDatetime(formData.get("last_reviewed_at")),
  };
}

function normalizeCreateSourceInput(
  input: ReturnType<typeof createSourceSchema.parse>,
) {
  return {
    ...input,
    url: input.url ?? null,
    notes: input.notes ?? null,
    last_checked_at: null,
    last_reviewed_at: input.last_reviewed_at ?? null,
    body_text: null,
    captured_at: null,
    reviewed_at: input.last_reviewed_at ?? null,
    archived_at: null,
  };
}

function normalizeUpdateSourceInput(
  input: ReturnType<typeof updateSourceSchema.parse>,
) {
  const normalized: Record<string, unknown> = { ...input };

  if ("last_reviewed_at" in normalized) {
    normalized.reviewed_at = normalized.last_reviewed_at ?? null;
  }

  return normalized;
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

function normalizeCaptureFetchInput(formData: FormData) {
  return {
    source_id: formData.get("source_id"),
    capture_method: "fetch" as const,
    url: formData.get("url"),
    title: normalizeNullableString(formData.get("title")),
  };
}

function normalizeCapturePasteInput(formData: FormData) {
  return {
    source_id: formData.get("source_id"),
    capture_method: "paste" as const,
    pasted_text: formData.get("pasted_text"),
    title: normalizeNullableString(formData.get("title")),
    original_url: normalizeNullableString(formData.get("original_url")),
  };
}

function revalidateSourcePaths(sourceId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/sources");
  revalidatePath(`/admin/sources/${sourceId}`);
  revalidatePath(`/admin/sources/${sourceId}/edit`);
  revalidatePath(`/admin/sources/${sourceId}/capture`);
}

export async function createSourceAction(
  previousState: SourceActionState = initialSourceActionState,
  formData: FormData,
) {
  void previousState;
  await requireAdminAccess();

  const parsed = createSourceSchema.safeParse(sourceInputFromFormData(formData));

  if (!parsed.success) {
    return toActionState(
      "Please correct the highlighted fields and try again.",
      parsed.error.flatten().fieldErrors,
    );
  }

  try {
    const source = await createSource(normalizeCreateSourceInput(parsed.data));
    revalidatePath("/admin");
    revalidatePath("/admin/sources");
    redirect(`/admin/sources/${source.id}`);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return toActionState("That source URL is already registered for this platform.", {
        url: ["That source URL is already registered for this platform."],
      });
    }

    return toActionState("Something went wrong while creating the source.");
  }
}

export async function updateSourceAction(
  sourceId: string,
  previousState: SourceActionState = initialSourceActionState,
  formData: FormData,
) {
  void previousState;
  await requireAdminAccess();

  const existing = await findSourceById(sourceId);
  if (!existing) {
    return toActionState("Source not found.");
  }

  const parsed = updateSourceSchema.safeParse(sourceInputFromFormData(formData));

  if (!parsed.success) {
    return toActionState(
      "Please correct the highlighted fields and try again.",
      parsed.error.flatten().fieldErrors,
    );
  }

  try {
    await updateSource(sourceId, normalizeUpdateSourceInput(parsed.data));
    revalidateSourcePaths(sourceId);
    redirect(`/admin/sources/${sourceId}`);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return toActionState("That source URL is already registered for this platform.", {
        url: ["That source URL is already registered for this platform."],
      });
    }

    return toActionState("Something went wrong while updating the source.");
  }
}

export async function archiveSourceAction(formData: FormData) {
  await requireAdminAccess();

  const parsed = archiveSourceSchema.safeParse({
    source_id: formData.get("source_id"),
  });

  if (!parsed.success) {
    return;
  }

  await archiveSource(parsed.data.source_id).catch(() => null);
  revalidateSourcePaths(parsed.data.source_id);
  redirect("/admin/sources");
}

export async function captureSourceByFetchAction(
  previousState: SourceActionState = initialSourceActionState,
  formData: FormData,
) {
  void previousState;
  await requireAdminAccess();

  const parsed = captureFetchSourceSchema.safeParse(
    normalizeCaptureFetchInput(formData),
  );

  if (!parsed.success) {
    return toActionState(
      "Please correct the highlighted fields and try again.",
      parsed.error.flatten().fieldErrors,
    );
  }

  try {
    const snapshot = await captureSourceByFetch(parsed.data);
    revalidateSourcePaths(parsed.data.source_id);
    revalidatePath(`/admin/sources/${parsed.data.source_id}/snapshots/${snapshot.id}`);
    redirect(`/admin/sources/${parsed.data.source_id}/snapshots/${snapshot.id}`);
  } catch (error) {
    if (error instanceof SourceCaptureError) {
      return toActionState(error.message);
    }

    return toActionState("Something went wrong while fetching the source.");
  }
}

export async function captureSourceByPasteAction(
  previousState: SourceActionState = initialSourceActionState,
  formData: FormData,
) {
  void previousState;
  await requireAdminAccess();

  const parsed = capturePasteSourceSchema.safeParse(
    normalizeCapturePasteInput(formData),
  );

  if (!parsed.success) {
    return toActionState(
      "Please correct the highlighted fields and try again.",
      parsed.error.flatten().fieldErrors,
    );
  }

  try {
    const snapshot = await captureSourceByPaste(parsed.data);
    revalidateSourcePaths(parsed.data.source_id);
    revalidatePath(`/admin/sources/${parsed.data.source_id}/snapshots/${snapshot.id}`);
    redirect(`/admin/sources/${parsed.data.source_id}/snapshots/${snapshot.id}`);
  } catch (error) {
    if (error instanceof SourceCaptureError) {
      return toActionState(error.message);
    }

    return toActionState("Something went wrong while saving the pasted source.");
  }
}
