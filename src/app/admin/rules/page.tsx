import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { listSignalRules } from "@/server/repositories/signal-repository";

export default async function RulesPage() {
  const rules = await listSignalRules().catch(() => []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Epic 6"
        title="Signal rules"
        description="Manage the deterministic keyword and regex rules used by the signal candidate engine."
        actions={
          <div className="flex items-center gap-3">
            <form action="/api/signals/run" method="post">
              <button className={cn(buttonVariants({ variant: "outline" }))}>
                Run matcher
              </button>
            </form>
            <Link href="/admin/rules/new" className={cn(buttonVariants())}>
              Create rule
            </Link>
          </div>
        }
      />
      <div className="grid gap-4">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-lg">
                    <Link href={`/admin/rules/${rule.id}/edit`} className="hover:underline">
                      {rule.rule_name}
                    </Link>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {rule.signal_name} · {rule.category.replaceAll("_", " ")}
                  </p>
                </div>
                <StatusBadge value={rule.enabled ? "active" : "archived"} />
              </div>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>Keywords: {Array.isArray(rule.keywords) ? rule.keywords.length : 0}</p>
              <p>
                Regex patterns:{" "}
                {Array.isArray(rule.regex_patterns) ? rule.regex_patterns.length : 0}
              </p>
              <p>Confidence weight: {rule.confidence_weight}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
