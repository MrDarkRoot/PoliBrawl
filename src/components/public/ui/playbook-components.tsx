"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, FileText, AlertTriangle, CheckCircle, Zap, ShieldAlert, ArrowRight, BookOpen, ExternalLink, Activity, Info, Link as LinkIcon, Compass, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { RiskBadge } from "@/components/public/layout";

export function SurvivalHero({
  name,
  category,
  riskLevel,
  websiteUrl,
  lastReviewed,
  summary,
}: {
  name: string;
  category: string;
  riskLevel: string;
  websiteUrl: string;
  lastReviewed: string;
  summary: string;
}) {
  return (
    <header className="mb-12 border-b border-slate-100 pb-10 pt-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              {category}
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <RiskBadge level={riskLevel} />
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="text-xs text-slate-400">Reviewed {lastReviewed}</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
            {name}
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed max-w-3xl">
            {summary}
          </p>
        </div>
        {websiteUrl && (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900 shrink-0 mt-2"
          >
            Official Website
            <ExternalLink className="ml-2 h-3.5 w-3.5" aria-hidden="true" />
          </a>
        )}
      </div>
    </header>
  );
}

export function SurvivalPriorityCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-6 my-8 shadow-sm">
      <div className="flex items-start gap-4">
        <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
        <div className="text-lg font-medium text-amber-900 leading-relaxed">
          <strong className="block text-amber-950 mb-1 text-sm uppercase tracking-widest">Survival Priority</strong>
          {children}
        </div>
      </div>
    </div>
  );
}

export function RiskMeter({ level }: { level: string }) {
  const getScore = (l: string) => {
    switch(l.toLowerCase()) {
      case 'critical': return 10;
      case 'high': return 8;
      case 'medium': return 5;
      case 'low': return 2;
      default: return 5;
    }
  };
  const score = getScore(level);
  
  return (
    <div className="mt-4">
      <div className="flex justify-between text-xs font-semibold mb-1">
        <span className="text-slate-500">Risk Severity</span>
        <span className={cn(
          score >= 8 ? 'text-red-600' : score >= 5 ? 'text-amber-600' : 'text-emerald-600'
        )}>{level.toUpperCase()}</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-1000",
            score >= 8 ? 'bg-red-500' : score >= 5 ? 'bg-amber-500' : 'bg-emerald-500'
          )}
          style={{ width: `${score * 10}%` }}
        />
      </div>
    </div>
  );
}

export function RiskSnapshotGrid({ risks }: { risks: { label: string; level: string; description: string }[] }) {
  return (
    <div className="my-12">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-6">Risk Snapshot</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {risks.map((risk, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-colors">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{risk.label}</div>
            <p className="text-sm text-slate-700 leading-relaxed min-h-[3rem]">{risk.description}</p>
            <RiskMeter level={risk.level} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SelfIdentificationChecklist({ items }: { items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="my-12 bg-slate-50 border border-slate-200 rounded-xl p-8">
      <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-6 flex items-center">
        <Zap className="w-5 h-5 mr-3 text-blue-600" />
        This matters most if you...
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <CheckCircle className="w-5 h-5 text-blue-600 mr-3 shrink-0" />
            <span className="text-slate-700 font-medium text-sm leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TopRiskCard({
  title,
  severity,
  impact,
  whyItMatters,
  preparation,
  href,
}: {
  title: string;
  severity: string;
  impact: string;
  whyItMatters: string;
  preparation: string;
  href: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm group hover:border-blue-200 hover:shadow-md transition-all">
      <div className="flex items-center gap-3 mb-4">
        <RiskBadge level={severity} />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors">
        <Link href={href} className="before:absolute before:inset-0 relative block">
          {title}
        </Link>
      </h3>
      
      <div className="grid sm:grid-cols-3 gap-6 mb-4">
        <div>
          <strong className="block text-xs uppercase tracking-wider text-slate-500 mb-1">What can happen</strong>
          <p className="text-sm text-slate-700">{impact}</p>
        </div>
        <div>
          <strong className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Why it matters</strong>
          <p className="text-sm text-slate-700">{whyItMatters}</p>
        </div>
        <div>
          <strong className="block text-xs uppercase tracking-wider text-slate-500 mb-1">How to prepare</strong>
          <p className="text-sm text-slate-700">{preparation}</p>
        </div>
      </div>
      
      <div className="text-sm font-medium text-blue-600 flex items-center mt-4">
        Read the full playbook <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
      </div>
    </div>
  );
}

export function SurvivalPlaybook({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-16">
      <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-8 flex items-center">
        <BookOpen className="w-8 h-8 mr-4 text-blue-600" />
        Survival Playbook
      </h2>
      <div className="grid gap-6 md:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

export function PlaybookColumn({ phase, title, children }: { phase: string; title: string; children: React.ReactNode }) {
  const getPhaseIcon = (p: string) => {
    if (p.toLowerCase().includes('before')) return <Compass className="w-5 h-5 text-emerald-600" />;
    if (p.toLowerCase().includes('during') || p.toLowerCase().includes('today')) return <Activity className="w-5 h-5 text-amber-600" />;
    return <Play className="w-5 h-5 text-blue-600" />;
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        {getPhaseIcon(phase)}
        <h3 className="font-bold text-slate-900">{title}</h3>
      </div>
      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">{phase}</div>
      <div className="prose prose-slate prose-sm text-slate-700">
        {children}
      </div>
    </div>
  );
}

export function TodaysActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-16">
      <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-8">Today&apos;s Actions</h2>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

export function ActionItemCard({ 
  title, 
  whyItMatters, 
  timeEstimate,
  priority
}: { 
  title: string; 
  whyItMatters: string; 
  timeEstimate?: string;
  priority?: "High" | "Medium" | "Low";
}) {
  return (
    <div className="flex items-start gap-4 p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="w-6 h-6 rounded border-2 border-slate-300 mt-0.5 flex-shrink-0 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer" />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <h4 className="font-semibold text-slate-900 text-base">{title}</h4>
          {priority && (
            <span className={cn(
              "px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider",
              priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
            )}>{priority} Priority</span>
          )}
          {timeEstimate && (
            <span className="text-xs text-slate-500">⏱ {timeEstimate}</span>
          )}
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">{whyItMatters}</p>
      </div>
    </div>
  );
}

export function BackupRails({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-16">
      <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-8">Backup Rails</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {children}
      </div>
    </div>
  );
}

export function BackupRailCard({
  title,
  whenToUse,
  tradeoffs,
}: {
  title: string;
  whenToUse: string;
  tradeoffs: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <h3 className="font-bold text-lg text-slate-900 mb-4">{title}</h3>
      <div className="space-y-4">
        <div>
          <strong className="block text-xs uppercase tracking-wider text-emerald-600 mb-1">When to use</strong>
          <p className="text-sm text-slate-700">{whenToUse}</p>
        </div>
        <div>
          <strong className="block text-xs uppercase tracking-wider text-amber-600 mb-1">Trade-offs</strong>
          <p className="text-sm text-slate-700">{tradeoffs}</p>
        </div>
      </div>
    </div>
  );
}

export function EvidenceAccordion({ items }: { items: { title: string; url?: string; excerpt: string; date: string }[] }) {
  const [expanded, setExpanded] = useState(false);

  if (!items || items.length === 0) return null;

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden my-12">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-6 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-slate-500" />
          <span className="font-bold text-slate-900 text-lg">How do we know? ({items.length} Official Sources)</span>
        </div>
        <ChevronDown className={cn("w-6 h-6 text-slate-400 transition-transform", expanded && "rotate-180")} />
      </button>
      
      {expanded && (
        <div className="divide-y divide-slate-100">
          {items.map((item, i) => (
            <div key={i} className="p-6">
              <div className="flex justify-between items-start mb-4 gap-4">
                <div>
                  <span className="block font-semibold text-slate-900 text-base mb-1">{item.title}</span>
                  <span className="text-xs font-medium text-slate-500 tracking-wide">Last verified: {item.date}</span>
                </div>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm font-medium text-blue-600 hover:underline shrink-0">
                    <LinkIcon className="w-4 h-4 mr-1.5" /> Source
                  </a>
                )}
              </div>
              <blockquote className="pl-5 border-l-4 border-slate-300 py-2 text-base text-slate-700 bg-slate-50 p-4 rounded-r-lg italic leading-relaxed">
                &quot;{item.excerpt}&quot;
              </blockquote>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function RelatedGuides({ platforms }: { platforms: { name: string; slug: string }[] }) {
  if (!platforms || platforms.length === 0) return null;
  return (
    <div className="my-16 border-t border-slate-100 pt-12">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-6">Compare Another Platform</h2>
      <div className="flex flex-wrap gap-4">
        {platforms.map(p => (
          <Link key={p.slug} href={`/platforms/${p.slug}`} className="inline-flex items-center justify-center px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all">
            {p.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function EditorialMethodology() {
  return (
    <aside className="bg-slate-50 border border-slate-200 rounded-xl p-6 my-12">
      <div className="flex items-start gap-4">
        <Info className="w-6 h-6 text-slate-400 mt-1 shrink-0" />
        <div className="text-sm text-slate-600 leading-relaxed">
          <strong className="block text-slate-900 font-semibold mb-1">Editorial Methodology</strong>
          PoliBrawl reviews official platform policies and turns operational risk clauses into practical survival guidance. We are independent and this is not legal advice. Our analysis focuses strictly on clauses that impact cash flow, account access, and daily operations.
        </div>
      </div>
    </aside>
  );
}

export function ReadingProgressNav({ links }: { links: { id: string; label: string }[] }) {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -80% 0px" }
    );

    links.forEach((link) => {
      const el = document.getElementById(link.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [links]);

  return (
    <aside className="hidden lg:block w-64 shrink-0 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-6 pb-12">
      <nav className="space-y-1.5 text-sm font-medium">
        {links.map((link) => (
          <Link
            key={link.id}
            href={`#${link.id}`}
            className={cn(
              "block px-3 py-2 rounded-md transition-colors",
              activeId === link.id
                ? "bg-blue-50 text-blue-700"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
