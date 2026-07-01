import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth";
import { logDecision } from "@/server/repositories/decision-log-repository";
import { sourceSchema } from "@/lib/validation/source";
import { findPolicySourceByPlatformUrl, createPolicySource } from "@/server/repositories/source-repository";

export async function POST(request: Request) {
  const auth = await requireAdminAccess();
  if (auth.kind === "missing-env") {
    return NextResponse.json({ error: "Supabase environment is not configured." }, { status: 500 });
  }

  const body = await request.json();
  const parsed = sourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
  }

  const duplicate = await findPolicySourceByPlatformUrl(parsed.data.platform_id, parsed.data.url);
  if (duplicate) {
    return NextResponse.json({ error: "A source with that URL already exists for the platform." }, { status: 409 });
  }

  const source = await createPolicySource({
    ...parsed.data,
    created_by: auth.user.id,
  });

  await logDecision({
    platformId: source.platform_id,
    entityType: "policy_source",
    entityId: source.id,
    action: "policy_source.created",
    newValue: source,
    decidedBy: auth.user.id,
  });

  return NextResponse.json({ id: source.id }, { status: 201 });
}
