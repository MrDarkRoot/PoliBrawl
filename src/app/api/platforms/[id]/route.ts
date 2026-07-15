import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth";
import { platformSchema } from "@/lib/validation/platform";
import { logDecision } from "@/server/repositories/decision-log-repository";
import {
  getPlatformById,
  getPlatformBySlug,
  updatePlatform,
} from "@/server/repositories/platform-repository";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminAccess();

  const { id } = await params;
  const current = await getPlatformById(id).catch(() => null);

  if (!current) {
    return NextResponse.json({ error: "Platform not found." }, { status: 404 });
  }

  const body = await request.json();
  const parsed = platformSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload." },
      { status: 400 },
    );
  }

  if (parsed.data.slug !== current.slug) {
    const duplicate = await getPlatformBySlug(parsed.data.slug);
    if (duplicate && duplicate.id !== id) {
      return NextResponse.json(
        { error: "A platform with that slug already exists." },
        { status: 409 },
      );
    }
  }

  const updated = await updatePlatform(id, {
    ...parsed.data,
    country: parsed.data.country || null,
    summary: parsed.data.summary || null,
    internal_notes: parsed.data.internal_notes || null,
    last_reviewed_at: parsed.data.last_reviewed_at ?? null,
  });

  await logDecision({
    platformId: updated.id,
    entityType: "platform",
    entityId: updated.id,
    action: "platform.updated",
    previousValue: current,
    newValue: updated,
    decidedBy: auth.user.id,
  });

  return NextResponse.json({ id: updated.id });
}
