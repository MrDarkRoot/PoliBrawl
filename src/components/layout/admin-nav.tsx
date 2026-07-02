"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { adminRouteGroups } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-6">
      {adminRouteGroups.map((group) => (
        <div key={group.label} className="space-y-1">
          <p className="px-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {group.label}
          </p>
          {group.routes.map((route) => {
            const isActive =
              route.href === "/admin"
                ? pathname === route.href
                : pathname.startsWith(route.href);

            return (
              <Link
                key={`${group.label}-${route.href}-${route.label}`}
                href={route.disabled ? "#" : route.href}
                aria-disabled={route.disabled}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors",
                  route.disabled && "pointer-events-none opacity-45",
                  isActive
                    ? "bg-zinc-950 text-white"
                    : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950",
                )}
              >
                <route.icon className="h-4 w-4" />
                <span>{route.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
