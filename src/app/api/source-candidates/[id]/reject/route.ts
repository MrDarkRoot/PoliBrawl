import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth";
import { logDecision } from "@/server/repositories/decision-log-repository";
import {
  getSourceCandidateById,
  updateSourceCandidate,
} from "@/server/repositories/discovery-repository";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminAccess();

  const { id } = await params;
  const candidate = await getSourceCandidateById(id).catch(() => null);
  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
  }

  await updateSourceCandidate(id, {
    status: "rejected",
    reviewed_at: new Date().toISOString(),
    reviewed_by: auth.user.id,
  });

  await logDecision({
    platformId: candidate.platform_id,
    entityType: "source_candidate",
    entityId: candidate.id,
    action: "source_candidate.rejected",
    decidedBy: auth.user.id,
  });

  return NextResponse.redirect(new URL("/admin/sources/candidates", request.url));
}
