import Link from "next/link";
import { ArrowRight, BookOpen, ShieldAlert, FileText, CheckCircle, Activity, CreditCard } from "lucide-react";
import { PublicNav, PublicFooter } from "@/components/public/layout";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getPublicPlatforms } from "@/server/polibrawl/services/public-delivery.service";
import { StackProfiler } from "@/components/public/ui/retention-components";

export const metadata = {
  title: "PoliBrawl — Survival Guides for Platform Risk",
  description:
    "PoliBrawl turns official platform policies into practical red flags, checklists, and backup plans for people who depend on online platforms.",
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

export default async function PublicLandingPage() {
  const platforms = await getPublicPlatforms();
  const latestPlatforms = platforms.slice(0, 4);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <PublicNav activePath="/" />

      <main className="flex-1" id="main-content">
        {/* Hero */}
        <section className="mx-auto max-w-[90rem] px-4 py-24 lg:px-8 lg:py-32">
          <div className="max-w-4xl">
            <p className="text-sm font-black uppercase tracking-widest text-blue-600 mb-8 flex items-center">
              <CheckCircle className="w-5 h-5 mr-3" /> Platform Policy Intelligence
            </p>
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight text-slate-900 leading-[1.05] mb-8">
              Don&apos;t let one platform freeze your business.
            </h1>
            <p className="text-2xl sm:text-3xl leading-snug text-slate-600 max-w-3xl font-medium mb-12">
              PoliBrawl turns official platform policies into practical red flags, survival checklists, and backup plans for people who depend on online platforms.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Link
                href="/platforms"
                className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto font-black text-lg px-10 h-16 rounded-xl")}
              >
                Browse platform guides
                <ArrowRight className="ml-3 h-5 w-5" aria-hidden="true" />
              </Link>
              <a
                href="#stack-profiler"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto font-bold text-lg px-10 h-16 rounded-xl border-2 border-slate-200 hover:border-slate-900 hover:bg-slate-50")}
              >
                <Activity className="mr-3 h-5 w-5 text-slate-500" />
                Build my stack
              </a>
            </div>
          </div>
        </section>

        {/* Stack Profiler */}
        <div id="stack-profiler">
          <StackProfiler platforms={platforms} />
        </div>

        {/* Latest Guides Loop */}
        <section className="border-t-2 border-slate-100 bg-white py-24">
          <div className="mx-auto max-w-[90rem] px-4 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-4xl font-black text-slate-900">Latest survival guides</h2>
              <Link href="/platforms" className="hidden sm:flex text-lg font-bold text-blue-600 hover:text-blue-800 transition-colors items-center">
                View all <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
            
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {latestPlatforms.map(p => (
                <Link key={p.slug} href={`/platforms/${p.slug}`} className="block group">
                  <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-8 hover:border-slate-900 hover:shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] transition-all h-full">
                    <h3 className="text-3xl font-black text-slate-900 mb-4">{p.name}</h3>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-8">{p.category.replace(/_/g, ' ')}</p>
                    <div className="flex items-center text-blue-600 font-bold text-lg group-hover:translate-x-2 transition-transform">
                      Read playbook <ArrowRight className="w-5 h-5 ml-2" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section
          className="border-t-2 border-slate-100 bg-slate-900 py-32"
          aria-labelledby="pillars-heading"
        >
          <div className="mx-auto max-w-[90rem] px-4 lg:px-8">
            <h2
              id="pillars-heading"
              className="text-4xl font-black text-white mb-16"
            >
              How it works
            </h2>
            <div className="grid gap-12 md:grid-cols-3">
              {pillars.map((pillar) => (
                <div key={pillar.title} className="space-y-6 bg-white/5 p-10 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                  <div
                    className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl ${pillar.color}`}
                    aria-hidden="true"
                  >
                    <pillar.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-black text-white">{pillar.title}</h3>
                  <p className="text-lg text-slate-300 leading-relaxed font-medium">{pillar.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Editorial note */}
        <section className="bg-white py-24">
          <div className="mx-auto max-w-[90rem] px-4 lg:px-8">
            <div className="flex items-start gap-6 p-8 bg-slate-50 rounded-2xl border-2 border-slate-200 max-w-4xl">
              <FileText className="w-8 h-8 text-slate-400 shrink-0 mt-1" />
              <p className="text-lg text-slate-600 leading-relaxed font-medium">
                <strong className="font-black text-slate-900 block mb-2 text-xl">Editorial Independence</strong>
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
