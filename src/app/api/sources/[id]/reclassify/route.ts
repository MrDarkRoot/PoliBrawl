import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth";
import {
  applyPolicySourceContentClassification,
  getPolicySourceById,
} from "@/server/repositories/source-repository";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminAccess();
  if (auth.kind === "missing-env") {
    return NextResponse.json({ error: "Supabase environment is not configured." }, { status: 500 });
  }

  const { id } = await params;
  const source = await getPolicySourceById(id).catch(() => null);
  if (!source) {
    return NextResponse.json({ error: "Source not found." }, { status: 404 });
  }

  await applyPolicySourceContentClassification(id);

  return NextResponse.redirect(new URL(`/admin/sources/${id}`, request.url));
}
