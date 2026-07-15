import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth";
import { evidenceSchema } from "@/lib/validation/evidence";
import { logDecision } from "@/server/repositories/decision-log-repository";
import { createEvidence, getSignalById } from "@/server/repositories/signal-repository";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminAccess();

  const { id } = await params;
  const signal = await getSignalById(id).catch(() => null);
  if (!signal) {
    return NextResponse.json({ error: "Signal not found." }, { status: 404 });
  }

  const body = await request.json();
  const parsed = evidenceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
  }

  const evidence = await createEvidence(id, {
    ...parsed.data,
    created_by: auth.user.id,
  });

  await logDecision({
    platformId: signal.signal.platform_id,
    entityType: "evidence_item",
    entityId: evidence.id,
    action: "evidence_item.created",
    newValue: evidence,
    decidedBy: auth.user.id,
  });

  return NextResponse.json({ evidenceId: evidence.id }, { status: 201 });
}
