import Link from "next/link";
import { Newspaper } from "lucide-react";

export function AppLogo() {
  return (
    <Link href="/" className="inline-flex items-center gap-3 font-semibold tracking-tight">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-200 text-zinc-950">
        <Newspaper className="h-5 w-5" />
      </span>
      <span className="flex flex-col">
        <span className="text-base leading-none">Editorial Platform</span>
        <span className="text-xs font-medium text-muted-foreground">
          Policy Intelligence
        </span>
      </span>
    </Link>
  );
}
