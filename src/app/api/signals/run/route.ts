import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth";
import { runSignalMatcher } from "@/server/services/signals/matcher";

export async function POST(request: Request) {
  const auth = await requireAdminAccess();
  if (auth.kind === "missing-env") {
    return NextResponse.json({ error: "Supabase environment is not configured." }, { status: 500 });
  }

  await runSignalMatcher();
  return NextResponse.redirect(new URL("/admin/signals/candidates", request.url));
}
