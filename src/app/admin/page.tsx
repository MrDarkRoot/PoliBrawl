import Link from "next/link";
import {
  BellRing,
  Building2,
  FileSearch,
  Files,
  NotebookPen,
  ScanSearch,
  Shapes,
  Sparkles,
} from "lucide-react";

import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getDashboardMetrics } from "@/server/repositories/dashboard-repository";

const quickLinks = [
  { href: "/admin/platforms", label: "Platforms", icon: Building2 },
  { href: "/admin/sources/candidates", label: "Candidate Queue", icon: FileSearch },
  { href: "/admin/sources", label: "Source Registry", icon: Files },
  { href: "/admin/clauses", label: "Clauses", icon: NotebookPen },
  { href: "/admin/rules", label: "Rules", icon: Shapes },
  { href: "/admin/review", label: "Review", icon: BellRing },
];

export default async function AdminDashboardPage() {
  const metrics = await getDashboardMetrics().catch(() => null);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic 0"
        title="Editorial command center"
        description="Track registry coverage, review backlog, and data-factory health across the editorial MVP."
        actions={
          <Link href="/admin/platforms/new" className={cn(buttonVariants())}>
            Create platform
          </Link>
        }
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Platforms" value={metrics?.platforms ?? "-"} icon={<Building2 className="h-4 w-4 text-muted-foreground" />} />
        <MetricCard label="Pending source candidates" value={metrics?.pendingCandidates ?? "-"} icon={<ScanSearch className="h-4 w-4 text-muted-foreground" />} />
        <MetricCard label="Signal candidates" value={metrics?.signalCandidates ?? "-"} icon={<Sparkles className="h-4 w-4 text-muted-foreground" />} />
        <MetricCard label="Evidence items" value={metrics?.evidenceItems ?? "-"} icon={<BellRing className="h-4 w-4 text-muted-foreground" />} />
      </section>
      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-auto justify-start gap-3 rounded-2xl p-4",
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pipeline readiness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              This admin is structured for the MVP flow in `todo.md`: platform
              registry, discovery, source review, versioning, clauses, rules, review,
              and evidence.
            </p>
            <p>
              Build order is enforced through navigation and repository boundaries,
              with server components for reads and explicit API routes for mutations.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
