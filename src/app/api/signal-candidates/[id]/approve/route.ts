import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth";
import { signalApprovalSchema } from "@/lib/validation/evidence";
import { logDecision } from "@/server/repositories/decision-log-repository";
import {
  createSignal,
  getSignalCandidateById,
  updateSignalCandidate,
} from "@/server/repositories/signal-repository";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminAccess();

  const { id } = await params;
  const candidate = await getSignalCandidateById(id).catch(() => null);
  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
  }

  const body = await request.json();
  const parsed = signalApprovalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
  }

  const signal = await createSignal(candidate.platform_id, {
    ...parsed.data,
    approvedBy: auth.user.id,
  });

  await updateSignalCandidate(id, {
    status: "approved",
    reviewed_at: new Date().toISOString(),
    reviewed_by: auth.user.id,
  });

  await logDecision({
    platformId: signal.platform_id,
    entityType: "signal_candidate",
    entityId: candidate.id,
    action: "signal_candidate.approved",
    newValue: signal,
    decidedBy: auth.user.id,
  });

  return NextResponse.json({ signalId: signal.id });
}
