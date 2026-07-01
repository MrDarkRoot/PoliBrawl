import type { ReactNode } from "react";
import { LogOut } from "lucide-react";

import { AppLogo } from "@/components/shared/app-logo";
import { AdminNav } from "@/components/layout/admin-nav";
import { Button } from "@/components/ui/button";

export function AdminShell({
  children,
  userEmail,
}: {
  children: ReactNode;
  userEmail?: string | null;
}) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(245,245,244,0.95),rgba(255,255,255,1))]">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-8 px-4 py-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6">
        <aside className="rounded-[2rem] border border-border/70 bg-white/85 p-5 shadow-sm backdrop-blur">
          <div className="flex h-full flex-col gap-8">
            <AppLogo />
            <AdminNav />
            <div className="mt-auto rounded-2xl border border-border/70 bg-zinc-50 p-4">
              <p className="text-sm font-medium">Signed in</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {userEmail ?? "Authenticated editor"}
              </p>
              <form action="/api/auth/logout" method="post" className="mt-4">
                <Button type="submit" variant="outline" className="w-full justify-between">
                  Logout
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </aside>
        <main className="min-w-0 rounded-[2rem] border border-border/70 bg-white/90 p-6 shadow-sm backdrop-blur lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
