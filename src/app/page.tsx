import Link from "next/link";
import { ArrowRight, BookOpen, ShieldAlert, FileText } from "lucide-react";
import { PublicNav, PublicFooter } from "@/components/public/layout";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "PoliBrawl — Platform Policy Intelligence",
  description:
    "Evidence-backed platform policy analysis. Understand the real risks in payment, creator, and SaaS platform terms before they affect your business.",
  openGraph: {
    title: "PoliBrawl — Platform Policy Intelligence",
    description:
      "Evidence-backed platform policy analysis. Understand the real risks in payment, creator, and SaaS platform terms before they affect your business.",
    url: "https://polibrawl.com",
    siteName: "PoliBrawl",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PoliBrawl — Platform Policy Intelligence",
    description:
      "Evidence-backed platform policy analysis. Understand the real risks in payment, creator, and SaaS platform terms before they affect your business.",
  },
};

const pillars = [
  {
    icon: ShieldAlert,
    color: "bg-red-100 text-red-700",
    title: "Policy Red Flags",
    description:
      "Clauses in platform agreements that may restrict your funds, suspend your account, or limit your operational freedom are documented with direct quotes.",
  },
  {
    icon: BookOpen,
    color: "bg-blue-100 text-blue-700",
    title: "Survival Guides",
    description:
      "Each reviewed platform includes a practical guide with notes and checklists to help you operate more safely within the platform's constraints.",
  },
  {
    icon: FileText,
    color: "bg-slate-100 text-slate-700",
    title: "Cited Evidence",
    description:
      "Every finding is anchored to specific source text. We cite the clause, the document, and the date of capture so you can verify independently.",
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
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-6">
              Platform Policy Intelligence
            </p>
            <h1 className="text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl text-balance leading-tight">
              Know the risks before they know you.
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600 max-w-2xl">
              PoliBrawl documents policy red flags in platform terms of service so
              freelancers, creators, and developers can make informed decisions about
              where to build their business.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/platforms"
                className={cn(buttonVariants({ size: "lg" }))}
              >
                Browse Platform Directory
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/about"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "lg" }),
                  "text-slate-600"
                )}
              >
                How it works
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
              className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-12"
            >
              What we provide
            </h2>
            <div className="grid gap-10 md:grid-cols-3">
              {pillars.map((pillar) => (
                <div key={pillar.title} className="space-y-4">
                  <div
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${pillar.color}`}
                    aria-hidden="true"
                  >
                    <pillar.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">{pillar.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{pillar.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Editorial note */}
        <section className="bg-white border-t border-slate-100 py-12">
          <div className="mx-auto max-w-6xl px-4 lg:px-6">
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              <strong className="font-medium text-slate-500">Editorial independence.</strong>{" "}
              PoliBrawl is not affiliated with any platform listed in this directory.
              Content is produced independently and does not constitute legal advice.{" "}
              <Link href="/about" className="underline hover:text-slate-700 transition-colors">
                Read our methodology &rarr;
              </Link>
            </p>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
