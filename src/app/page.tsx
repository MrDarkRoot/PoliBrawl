import Link from "next/link";
import { ArrowRight, Database, Radar, Scale } from "lucide-react";

import { AppLogo } from "@/components/shared/app-logo";
import { ConfigBanner } from "@/components/shared/config-banner";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasSupabaseEnv } from "@/lib/env";
import { cn } from "@/lib/utils";

const pillars = [
  {
    title: "Registry",
    description:
      "Track platforms, source metadata, and editorial readiness from one admin surface.",
    icon: Database,
  },
  {
    title: "Discovery",
    description:
      "Find legal and policy URLs using robots, sitemap, path heuristics, and page navigation.",
    icon: Radar,
  },
  {
    title: "Signals",
    description:
      "Split clauses, run rules, and build evidence-backed editorial signals.",
    icon: Scale,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(253,230,138,0.24),transparent_28%),linear-gradient(180deg,#fafaf9,#ffffff)]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 lg:px-6">
        <header className="flex items-center justify-between">
          <AppLogo />
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Login
            </Link>
            <Link
              href="/admin"
              className={cn(buttonVariants({ variant: "default" }))}
            >
              Open admin
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </header>
        <main className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-8">
            {!hasSupabaseEnv() ? <ConfigBanner /> : null}
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Internal editorial operations
              </p>
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-balance">
                Build evidence-first platform policy coverage from discovery to review.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                This admin application runs the MVP pipeline for platform intake,
                source registry, versioning, clause processing, signal review, and
                evidence construction.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {pillars.map((pillar) => (
                <Card
                  key={pillar.title}
                  className="border-border/70 bg-white/80 backdrop-blur"
                >
                  <CardHeader className="pb-3">
                    <pillar.icon className="h-5 w-5 text-zinc-700" />
                    <CardTitle className="pt-4 text-lg">{pillar.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm leading-6 text-muted-foreground">
                    {pillar.description}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
          <section>
            <Card className="overflow-hidden border-zinc-950/10 bg-zinc-950 text-zinc-50 shadow-2xl shadow-zinc-950/10">
              <CardHeader className="border-b border-white/10 pb-5">
                <CardTitle className="text-2xl">MVP workflow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 p-6 text-sm leading-6 text-zinc-300">
                <div>
                  Platform intake → Policy discovery → Candidate review → Source
                  registry
                </div>
                <div>Fetch → Extract → Hash → Version → Section → Clause</div>
                <div>Rule matching → Signal review → Evidence builder</div>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}
