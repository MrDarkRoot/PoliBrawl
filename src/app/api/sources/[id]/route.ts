import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth";
import { logDecision } from "@/server/repositories/decision-log-repository";
import { sourceSchema } from "@/lib/validation/source";
import { getPolicySourceById, updatePolicySource } from "@/server/repositories/source-repository";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminAccess();
  if (auth.kind === "missing-env") {
    return NextResponse.json({ error: "Supabase environment is not configured." }, { status: 500 });
  }

  const { id } = await params;
  const current = await getPolicySourceById(id).catch(() => null);
  if (!current) {
    return NextResponse.json({ error: "Source not found." }, { status: 404 });
  }

  const body = await request.json();
  const parsed = sourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
  }

  const updated = await updatePolicySource(id, parsed.data);

  await logDecision({
    platformId: updated.platform_id,
    entityType: "policy_source",
    entityId: updated.id,
    action: "policy_source.updated",
    previousValue: current,
    newValue: updated,
    decidedBy: auth.user.id,
  });

  return NextResponse.json({ id: updated.id });
}
