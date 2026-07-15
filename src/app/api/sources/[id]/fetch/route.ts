import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth";
import { getPolicySourceById } from "@/server/repositories/source-repository";
import { updatePolicySource } from "@/server/repositories/source-repository";
import { fetchPolicySource } from "@/server/services/fetch/fetcher";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdminAccess();

  const { id } = await params;
  const source = await getPolicySourceById(id).catch(() => null);
  if (!source) {
    return NextResponse.json({ error: "Source not found." }, { status: 404 });
  }

  const result = await fetchPolicySource({ id: source.id, url: source.url });
  if (result.ok) {
    await updatePolicySource(source.id, {
      final_url: result.finalUrl ?? source.final_url,
      status: "active",
    });
  }

  return NextResponse.redirect(new URL(`/admin/sources/${source.id}`, request.url));
}
