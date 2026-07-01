import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth";
import { logDecision } from "@/server/repositories/decision-log-repository";
import {
  getSignalCandidateById,
  updateSignalCandidate,
} from "@/server/repositories/signal-repository";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminAccess();
  if (auth.kind === "missing-env") {
    return NextResponse.json({ error: "Supabase environment is not configured." }, { status: 500 });
  }

  const { id } = await params;
  const candidate = await getSignalCandidateById(id).catch(() => null);
  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
  }

  const formData = await request.formData();
  const reason = String(formData.get("reason") ?? "");

  await updateSignalCandidate(id, {
    status: "rejected",
    reviewed_at: new Date().toISOString(),
    reviewed_by: auth.user.id,
  });

  await logDecision({
    platformId: candidate.platform_id,
    entityType: "signal_candidate",
    entityId: candidate.id,
    action: "signal_candidate.rejected",
    reason,
    decidedBy: auth.user.id,
  });

  return NextResponse.redirect(new URL("/admin/review", request.url));
}
