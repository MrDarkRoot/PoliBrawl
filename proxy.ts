import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { getSupabasePublicEnv, hasSupabaseEnv } from "@/lib/env";

export async function proxy(request: NextRequest) {
  const env = getSupabasePublicEnv();

  if (!env) {
    if (request.nextUrl.pathname.startsWith("/admin") || request.nextUrl.pathname.startsWith("/api/")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    return NextResponse.next({ request });
  }

  if (
    !hasSupabaseEnv() &&
    (request.nextUrl.pathname.startsWith("/admin") ||
      request.nextUrl.pathname.startsWith("/api/"))
  ) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
