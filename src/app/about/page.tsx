import Link from "next/link";
import { PublicNav, PublicFooter } from "@/components/public/layout";

export const metadata = {
  title: "About | PoliBrawl",
  description:
    "How PoliBrawl reviews platform policies, what we publish, and what we don't. Evidence-first methodology, editorial independence, and no legal advice.",
  openGraph: {
    title: "About | PoliBrawl",
    description:
      "How PoliBrawl reviews platform policies, what we publish, and what we don't. Evidence-first methodology, editorial independence, and no legal advice.",
    url: "https://polibrawl.com/about",
    siteName: "PoliBrawl",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "About | PoliBrawl",
    description:
      "How PoliBrawl reviews platform policies, what we publish, and what we don't. Evidence-first methodology, editorial independence, and no legal advice.",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicNav activePath="/about" />

      <main className="flex-1 py-16 mx-auto w-full max-w-3xl px-4 lg:px-6" id="main-content">
        <div className="space-y-12">
          <header>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              About PoliBrawl
            </h1>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed max-w-2xl">
              PoliBrawl is an independent editorial platform that documents policy risks in platform
              terms of service. Our goal is to help freelancers, creators, and developers understand
              what they are agreeing to before it affects their work.
            </p>
          </header>

          <section aria-labelledby="methodology-heading" className="space-y-4">
            <h2
              id="methodology-heading"
              className="text-xs font-semibold uppercase tracking-widest text-slate-400"
            >
              Methodology
            </h2>
            <div className="prose prose-slate text-sm max-w-none">
              <p>
                Our editorial process starts with capturing a verifiable snapshot of a
                platform&apos;s publicly available legal and policy documents. A reviewer then reads
                the relevant sections, identifies clauses that may restrict user rights, and writes
                a red flag based directly on the source text.
              </p>
              <p>
                Each published red flag must include at minimum one approved evidence item — a short
                excerpt from the source document, the source name, and a link to the original
                document. Evidence items are reviewed before publication. Nothing is published
                without a source.
              </p>
              <p>
                Survival notes and checklists are written by the editorial team to translate policy
                findings into practical guidance. They represent editorial opinion, not legal advice.
              </p>
            </div>
          </section>

          <section aria-labelledby="independence-heading" className="space-y-4">
            <h2
              id="independence-heading"
              className="text-xs font-semibold uppercase tracking-widest text-slate-400"
            >
              Independence
            </h2>
            <div className="prose prose-slate text-sm max-w-none">
              <p>
                PoliBrawl is not affiliated with, endorsed by, or sponsored by any platform
                listed in this directory. Platforms are not notified before coverage is published.
                We do not accept payment to modify, remove, or delay red flag coverage.
              </p>
              <p>
                We use platform names in text for editorial identification purposes only. We do not
                reproduce official logos, brand colors, or screenshots in a way that implies
                partnership or endorsement.
              </p>
            </div>
          </section>

          <section aria-labelledby="community-heading" className="space-y-4">
            <h2
              id="community-heading"
              className="text-xs font-semibold uppercase tracking-widest text-slate-400"
            >
              Community Signals
            </h2>
            <div className="prose prose-slate text-sm max-w-none">
              <p>
                We accept community experience reports and platform review requests from users.
                All submissions are held for editorial review before any public use. We do not
                auto-publish community content, and we never expose raw reports publicly.
              </p>
              <p>
                Community signals influence our editorial priorities — they tell us which platforms
                to investigate or update — but the published content is always written and reviewed
                by our editorial team.
              </p>
            </div>
          </section>

          <section
            aria-labelledby="disclaimer-heading"
            className="space-y-4"
          >
            <h2
              id="disclaimer-heading"
              className="text-xs font-semibold uppercase tracking-widest text-slate-400"
            >
              Not Legal Advice
            </h2>
            <div
              className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-sm text-slate-700 leading-relaxed"
              role="note"
            >
              <p>
                The content published on PoliBrawl is for informational and editorial purposes
                only. It does not constitute legal advice and should not be treated as such.
                PoliBrawl is not a law firm and does not provide legal representation. If you have
                specific legal questions about a platform&apos;s policies, you should consult a
                qualified attorney in your jurisdiction.
              </p>
              <p className="mt-3">
                Policy documents change over time. Evidence items include a capture date, but
                platform policies may have been updated since coverage was published. Always check
                the current terms on the platform&apos;s official website.
              </p>
            </div>
          </section>

          <section aria-labelledby="scope-heading" className="space-y-4">
            <h2
              id="scope-heading"
              className="text-xs font-semibold uppercase tracking-widest text-slate-400"
            >
              What we cover
            </h2>
            <ul
              className="text-sm text-slate-600 space-y-2 leading-relaxed"
              role="list"
            >
              <li>Payment processors and merchant platforms</li>
              <li>Creator economy platforms and freelance marketplaces</li>
              <li>SaaS developer tools with significant lock-in or data terms</li>
            </ul>
          </section>

          <div className="border-t border-slate-100 pt-8">
            <p className="text-sm text-slate-500">
              Have a platform to suggest?{" "}
              <Link
                href="/platforms"
                className="text-blue-600 hover:underline"
              >
                Browse the current directory
              </Link>{" "}
              to see what is already covered.
            </p>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
