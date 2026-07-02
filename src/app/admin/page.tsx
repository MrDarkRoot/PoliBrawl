import Link from "next/link";
import {
  Building2,
  FileStack,
  ShieldAlert,
  Users,
} from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { countPlatforms } from "@/server/polibrawl/repositories/platform.repository";

const quickLinks = [
  { href: "/admin/platforms", label: "Platforms", icon: Building2 },
  { href: "#", label: "Sources", icon: FileStack, disabled: true },
  { href: "#", label: "Candidates", icon: ShieldAlert, disabled: true },
  { href: "#", label: "Community", icon: Users, disabled: true },
];

export default async function AdminDashboardPage() {
  const platformCount = await countPlatforms().catch(() => 0);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic B"
        title="PoliBrawl Admin"
        description="The active internal CMS path starts with the Platform Registry. Other modules stay intentionally disabled until later sprints."
        actions={
          <Link href="/admin/platforms/new" className={cn(buttonVariants())}>
            Create Platform
          </Link>
        }
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Platforms" value={platformCount} icon={<Building2 className="h-4 w-4 text-muted-foreground" />} />
        <MetricCard label="Sources" value="Later" icon={<FileStack className="h-4 w-4 text-muted-foreground" />} />
        <MetricCard label="Candidates" value="Later" icon={<ShieldAlert className="h-4 w-4 text-muted-foreground" />} />
        <MetricCard label="Community" value="Later" icon={<Users className="h-4 w-4 text-muted-foreground" />} />
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
                href={link.disabled ? "#" : link.href}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-auto justify-start gap-3 rounded-2xl p-4",
                  link.disabled && "pointer-events-none opacity-45",
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
            <CardTitle>Current Sprint</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Sprint 2 proves the PoliBrawl stack end-to-end for the Platform Registry only.
            </p>
            <p>
              Navigation keeps future PoliBrawl modules visible but disabled, while legacy discovery, clauses, rules, and review paths are separated under Legacy.
            </p>
          </CardContent>
        </Card>
      </section>
      {!platformCount ? (
        <EmptyState
          title="No platforms yet"
          description="Create the first PoliBrawl platform record to start the new internal CMS path."
          action={
            <Link href="/admin/platforms/new" className={cn(buttonVariants())}>
              Create Platform
            </Link>
          }
        />
      ) : null}
    </div>
  );
}
