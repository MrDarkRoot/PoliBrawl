import Link from "next/link";
import { ArrowRight, BookOpen, ShieldAlert, FileText, CheckCircle, Activity } from "lucide-react";
import { PublicNav, PublicFooter } from "@/components/public/layout";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "PoliBrawl — Survival Guides for Platform Risk",
  description:
    "PoliBrawl turns official platform policies into practical red flags, checklists, and backup plans for people who depend on online platforms.",
  openGraph: {
    title: "PoliBrawl — Survival Guides for Platform Risk",
    description:
      "PoliBrawl turns official platform policies into practical red flags, checklists, and backup plans for people who depend on online platforms.",
    url: "https://polibrawl.com",
    siteName: "PoliBrawl",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PoliBrawl — Survival Guides for Platform Risk",
    description:
      "PoliBrawl turns official platform policies into practical red flags, checklists, and backup plans for people who depend on online platforms.",
  },
};

const pillars = [
  {
    icon: ShieldAlert,
    color: "bg-red-100 text-red-700",
    title: "Risk Translation",
    description:
      "We read the fine print and highlight the clauses that can freeze your cash flow or terminate your account without warning.",
  },
  {
    icon: Activity,
    color: "bg-amber-100 text-amber-700",
    title: "Actionable Playbooks",
    description:
      "No vague legal advice. We provide phase-by-phase survival steps: what to do before, during, and after an account review.",
  },
  {
    icon: BookOpen,
    color: "bg-blue-100 text-blue-700",
    title: "Backup Architecture",
    description:
      "For every critical risk, we document the technical and operational backup rails you need to survive a sudden platform ban.",
  },
] as const;

export default function PublicLandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "PoliBrawl",
    url: "https://polibrawl.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://polibrawl.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicNav activePath="/" />

      <main className="flex-1" id="main-content">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 py-24 lg:px-6 lg:py-32">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-6 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" /> Platform Policy Intelligence
            </p>
            <h1 className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl text-balance leading-tight">
              Survival guides for platform risk.
            </h1>
            <p className="mt-6 text-xl leading-relaxed text-slate-600 max-w-2xl">
              PoliBrawl turns official platform policies into practical red flags, checklists, and backup plans for founders, creators, and agencies who depend on online platforms.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/platforms"
                className={cn(buttonVariants({ size: "lg" }), "font-bold text-base px-8 h-12")}
              >
                Browse Survival Guides
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* Pillars */}
        <section
          className="border-t border-slate-100 bg-slate-50 py-20"
          aria-labelledby="pillars-heading"
        >
          <div className="mx-auto max-w-6xl px-4 lg:px-6">
            <h2
              id="pillars-heading"
              className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-12"
            >
              How PoliBrawl Works
            </h2>
            <div className="grid gap-10 md:grid-cols-3">
              {pillars.map((pillar) => (
                <div key={pillar.title} className="space-y-4 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                  <div
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${pillar.color}`}
                    aria-hidden="true"
                  >
                    <pillar.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{pillar.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{pillar.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Editorial note */}
        <section className="bg-white border-t border-slate-100 py-16">
          <div className="mx-auto max-w-6xl px-4 lg:px-6">
            <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-xl border border-slate-200 max-w-3xl">
              <FileText className="w-6 h-6 text-slate-400 shrink-0 mt-1" />
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong className="font-bold text-slate-900 block mb-1">Editorial Independence</strong>
                PoliBrawl is not affiliated with any platform listed in this directory. Our analysis focuses strictly on operational risk. Content is produced independently and does not constitute legal advice.
              </p>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
