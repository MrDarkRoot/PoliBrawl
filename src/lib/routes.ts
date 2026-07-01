import {
  BellRing,
  Building2,
  DatabaseZap,
  FileCode2,
  Globe2,
  Radar,
  Scale,
} from "lucide-react";

export const adminRoutes = [
  { href: "/admin", label: "Dashboard", icon: Globe2, disabled: false },
  { href: "/admin/platforms", label: "Platforms", icon: Building2, disabled: false },
  { href: "/admin/discovery", label: "Discovery", icon: Radar, disabled: true },
  { href: "/admin/sources", label: "Sources", icon: DatabaseZap, disabled: false },
  { href: "/admin/clauses", label: "Clauses", icon: FileCode2, disabled: false },
  { href: "/admin/rules", label: "Rules", icon: Scale, disabled: false },
  { href: "/admin/review", label: "Review", icon: BellRing, disabled: false },
] as const;
