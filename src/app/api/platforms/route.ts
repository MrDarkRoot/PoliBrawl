import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth";
import { platformSchema } from "@/lib/validation/platform";
import { createEditorialTask } from "@/server/repositories/editorial-task-repository";
import { createPlatform, getPlatformBySlug } from "@/server/repositories/platform-repository";

export async function POST(request: Request) {
  const auth = await requireAdminAccess();

  const body = await request.json();
  const parsed = platformSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload." },
      { status: 400 },
    );
  }

  const duplicate = await getPlatformBySlug(parsed.data.slug);

  if (duplicate) {
    return NextResponse.json(
      { error: "A platform with that slug already exists." },
      { status: 409 },
    );
  }

  const platform = await createPlatform({
    ...parsed.data,
    country: parsed.data.country || null,
    summary: parsed.data.summary || null,
    internal_notes: parsed.data.internal_notes || null,
    created_by: auth.user.id,
    last_reviewed_at: parsed.data.last_reviewed_at ?? null,
  });

  await createEditorialTask({
    taskType: "new_platform",
    platformId: platform.id,
    relatedEntityType: "platform",
    relatedEntityId: platform.id,
    title: `New platform intake: ${platform.name}`,
    createdBy: auth.user.id,
  });

  return NextResponse.json({ id: platform.id }, { status: 201 });
}
