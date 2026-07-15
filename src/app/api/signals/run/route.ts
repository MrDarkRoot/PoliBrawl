import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth";
import { runSignalMatcher } from "@/server/services/signals/matcher";

export async function POST(request: Request) {
  await requireAdminAccess();

  await runSignalMatcher();
  return NextResponse.redirect(new URL("/admin/signals/candidates", request.url));
}
