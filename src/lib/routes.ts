import {
  Building2,
  FlaskConical,
  Globe2,
  LayoutList,
  ScanSearch,
  ShieldAlert,
  Users,
} from "lucide-react";

export const adminRouteGroups = [
  {
    label: "PoliBrawl",
    routes: [
      { href: "/admin", label: "Dashboard", icon: Globe2, disabled: false },
      { href: "/admin/platforms", label: "Platforms", icon: Building2, disabled: false },
      { href: "/admin/sources", label: "Sources", icon: LayoutList, disabled: false },
      { href: "/admin/candidates", label: "Candidates", icon: ScanSearch, disabled: false },
      { href: "/admin/research-packets", label: "Research Packets", icon: FlaskConical, disabled: false },
      { href: "/admin/red-flags", label: "Red Flags", icon: ShieldAlert, disabled: false },
      { href: "/admin/survival-pages", label: "Survival Pages", icon: LayoutList, disabled: false },
      { href: "/admin/community", label: "Community", icon: Users, disabled: true },
      { href: "/admin/publisher", label: "Publisher", icon: LayoutList, disabled: true },
    ],
  },
  {
    label: "Legacy",
    routes: [
      { href: "/admin/discovery", label: "Discovery", icon: LayoutList, disabled: false },
      { href: "/admin/clauses", label: "Clauses", icon: LayoutList, disabled: false },
      { href: "/admin/rules", label: "Rules", icon: LayoutList, disabled: false },
      { href: "/admin/review", label: "Review", icon: LayoutList, disabled: false },
    ],
  },
] as const;
