"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { adminRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {adminRoutes.map((route) => {
        const isActive =
          route.href === "/admin"
            ? pathname === route.href
            : pathname.startsWith(route.href);

        return (
          <Link
            key={route.href}
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
    </nav>
  );
}
