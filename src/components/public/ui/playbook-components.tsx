"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, FileText, AlertTriangle, CheckSquare, Zap, ArrowRight, BookOpen, ExternalLink, Activity, Info, Link as LinkIcon, Compass, Target, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { RiskBadge } from "@/components/public/ui/risk-badge";

export function SurvivalGuideHero({
  name,
  category,
  riskLevel,
  websiteUrl,
  lastReviewed,
  uncomfortableTruth,
  summary,
  children,
}: {
  name: string;
  category: string;
  riskLevel: string;
  websiteUrl: string;
  lastReviewed: string;
  uncomfortableTruth: string;
  summary: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-16 border-b-2 border-slate-900 pb-12 pt-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
        <div className="space-y-6 max-w-3xl">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-black tracking-widest text-slate-800 uppercase bg-slate-100 px-3 py-1 rounded-sm">
              {category}
            </span>
            <RiskBadge level={riskLevel} />
            <span className="text-sm font-semibold text-slate-500">Reviewed {lastReviewed}</span>
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-slate-900 leading-[1.1]">
            {name} Survival Playbook
          </h1>
          
          <div className="text-2xl sm:text-3xl font-bold text-slate-800 leading-snug border-l-4 border-red-500 pl-6 my-8">
            {uncomfortableTruth}
          </div>
          
          <p className="text-xl sm:text-2xl text-slate-600 leading-relaxed font-medium max-w-3xl">
            {summary}
          </p>

          {children && (
            <div className="pt-4">
              {children}
            </div>
          )}
        </div>
        
        {websiteUrl && (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex h-12 items-center justify-center rounded-lg border-2 border-slate-900 bg-white px-6 py-3 text-base font-bold shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition-transform hover:-translate-y-1 hover:shadow-[4px_6px_0px_0px_rgba(15,23,42,1)] shrink-0"
          >
            Official Website
            <ExternalLink className="ml-3 h-5 w-5" aria-hidden="true" />
          </a>
        )}
      </div>
    </header>
  );
}

export function UncomfortableTruth({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="bg-slate-900 text-white rounded-2xl p-8 sm:p-12 my-12 shadow-2xl relative overflow-hidden">
      <div className="absolute -top-10 -right-10 opacity-10">
        <Target className="w-64 h-64" />
      </div>
      <h2 className="text-sm font-black uppercase tracking-widest text-amber-400 mb-4 flex items-center relative z-10">
        <AlertTriangle className="w-5 h-5 mr-3" /> The Uncomfortable Truth
      </h2>
      <p className="text-3xl sm:text-4xl font-bold leading-tight relative z-10 text-white balance">
        {message}
      </p>
    </div>
  );
}

export function SurvivalPriorityBlock({ heading, message, subtext }: { heading: string; message: string; subtext: string }) {
  return (
    <div className="bg-red-50 border-2 border-red-500 p-8 sm:p-10 my-12 rounded-xl shadow-[8px_8px_0px_0px_rgba(239,68,68,0.2)]">
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-black text-red-700 uppercase tracking-widest">{heading}</h2>
        <div className="text-3xl sm:text-4xl font-bold text-red-950 leading-tight">
          {message}
        </div>
        {subtext && (
          <p className="text-xl text-red-900 font-medium mt-2">{subtext}</p>
        )}
      </div>
    </div>
  );
}

export function ExposureChecklist({ items }: { items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="my-16">
      <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-8 flex items-center">
        <Zap className="w-10 h-10 mr-4 text-amber-500" />
        Are you exposed?
      </h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start bg-slate-50 border-2 border-slate-200 rounded-xl p-6 shadow-sm hover:border-blue-500 transition-colors cursor-default">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-4 shrink-0 mt-0.5">
              <CheckSquare className="w-5 h-5" />
            </div>
            <span className="text-slate-800 font-bold text-xl leading-snug">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RiskMeterCard({ label, level, description }: { label: string; level: string; description: string }) {
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
    <div className="bg-white border-2 border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col justify-between hover:shadow-lg transition-all">
      <div>
        <div className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4">{label}</div>
        <p className="text-lg text-slate-800 font-semibold leading-snug mb-8">{description}</p>
      </div>
      <div>
        <div className="flex justify-between text-sm font-black uppercase tracking-wider mb-2">
          <span className="text-slate-500">Risk Severity</span>
          <span className={cn(
            score >= 8 ? 'text-red-600' : score >= 5 ? 'text-amber-600' : 'text-emerald-600'
          )}>{level}</span>
        </div>
        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-1000",
              score >= 8 ? 'bg-red-500' : score >= 5 ? 'bg-amber-500' : 'bg-emerald-500'
            )}
            style={{ width: `${score * 10}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function RiskMeterGrid({ risks }: { risks: { label: string; level: string; description: string }[] }) {
  return (
    <div className="my-16">
      <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-10">Risk Snapshot</h2>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {risks.map((risk, i) => (
          <RiskMeterCard key={i} {...risk} />
        ))}
      </div>
    </div>
  );
}

export function TopThingsThatCanGoWrong({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-16">
      <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-10">Top Things That Can Go Wrong</h2>
      <div className="space-y-8">
        {children}
      </div>
    </div>
  );
}

export function StoryRiskCard({
  title,
  severity,
  uncomfortableTruth,
  whatCanHappen,
  whyItHurts,
  prepareNow,
  href,
}: {
  title: string;
  severity: string;
  uncomfortableTruth: string;
  whatCanHappen: string;
  whyItHurts: string;
  prepareNow: string;
  href: string;
}) {
  return (
    <div className="bg-white border-2 border-slate-900 rounded-2xl p-8 sm:p-10 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] group hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] transition-all">
      <div className="flex items-center gap-4 mb-6">
        <RiskBadge level={severity} />
      </div>
      <h3 className="text-3xl font-black text-slate-900 mb-6 group-hover:text-blue-700 transition-colors">
        <Link href={href} className="before:absolute before:inset-0 relative block">
          {title}
        </Link>
      </h3>
      
      <div className="text-xl font-bold text-slate-800 border-l-4 border-amber-500 pl-4 mb-8">
        {uncomfortableTruth}
      </div>

      <div className="grid sm:grid-cols-3 gap-8 mb-8">
        <div>
          <strong className="block text-sm font-black uppercase tracking-widest text-slate-500 mb-2">What can happen</strong>
          <p className="text-lg font-medium text-slate-700">{whatCanHappen}</p>
        </div>
        <div>
          <strong className="block text-sm font-black uppercase tracking-widest text-slate-500 mb-2">Operational Consequence</strong>
          <p className="text-lg font-medium text-slate-700">{whyItHurts}</p>
        </div>
        <div>
          <strong className="block text-sm font-black uppercase tracking-widest text-slate-500 mb-2">Prepare now</strong>
          <p className="text-lg font-medium text-slate-700">{prepareNow}</p>
        </div>
      </div>
      
      <div className="text-lg font-bold text-blue-700 flex items-center mt-6 uppercase tracking-wider">
        Read survival steps <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-2" />
      </div>
    </div>
  );
}

export function SurvivalPlaybook({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-20">
      <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 mb-12 flex items-center">
        <BookOpen className="w-12 h-12 mr-6 text-blue-600" />
        Survival Playbook
      </h2>
      <div className="grid gap-8 md:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

export function PlaybookPhaseCard({ phase, title, children }: { phase: string; title: string; children: React.ReactNode }) {
  const getPhaseStyles = (p: string) => {
    if (p.toLowerCase().includes('before')) return { icon: <Compass className="w-8 h-8 text-emerald-600 mb-6" />, border: 'border-emerald-200', bg: 'bg-emerald-50' };
    if (p.toLowerCase().includes('today') || p.toLowerCase().includes('happens')) return { icon: <Activity className="w-8 h-8 text-amber-600 mb-6" />, border: 'border-amber-200', bg: 'bg-amber-50' };
    return { icon: <Shield className="w-8 h-8 text-blue-600 mb-6" />, border: 'border-blue-200', bg: 'bg-blue-50' };
  };

  const style = getPhaseStyles(phase);

  return (
    <div className={cn("border-2 rounded-2xl p-8 sm:p-10", style.bg, style.border)}>
      {style.icon}
      <div className="text-sm font-black uppercase tracking-widest text-slate-500 mb-2">{phase}</div>
      <h3 className="text-2xl font-black text-slate-900 mb-6">{title}</h3>
      <div className="prose prose-lg prose-slate text-slate-800 font-medium">
        {children}
      </div>
    </div>
  );
}

export function WhatToDoToday({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-20">
      <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-10">What To Do Today</h2>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

export function TodayActionCard({ 
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
    <div className="flex flex-col sm:flex-row items-start gap-6 p-8 bg-white border-2 border-slate-200 rounded-2xl shadow-sm hover:border-blue-400 transition-colors cursor-pointer group">
      <div className="w-8 h-8 rounded-lg border-2 border-slate-300 mt-1 flex-shrink-0 bg-slate-50 group-hover:bg-blue-50 group-hover:border-blue-400 transition-colors" />
      <div className="flex-1 min-w-0 w-full">
        <div className="flex flex-wrap items-center gap-4 mb-3">
          <h4 className="font-bold text-slate-900 text-2xl">{title}</h4>
          {priority && (
            <span className={cn(
              "px-3 py-1 rounded-md text-sm font-black uppercase tracking-widest",
              priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
            )}>{priority}</span>
          )}
          {timeEstimate && (
            <span className="text-sm font-bold text-slate-500 ml-auto">⏱ {timeEstimate}</span>
          )}
        </div>
        <p className="text-lg font-medium text-slate-600 leading-relaxed"><strong className="text-slate-800">Why: </strong>{whyItMatters}</p>
      </div>
    </div>
  );
}

export function BackupRails({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-20">
      <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-10">Backup Rails</h2>
      <div className="grid gap-8 md:grid-cols-2">
        {children}
      </div>
    </div>
  );
}

export function BackupRailCard({
  title,
  whenToUse,
  riskReduced,
  tradeoffs,
}: {
  title: string;
  whenToUse: string;
  riskReduced: string;
  tradeoffs: string;
}) {
  return (
    <div className="bg-white border-2 border-slate-200 rounded-2xl p-8 sm:p-10 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="font-black text-3xl text-slate-900 mb-8">{title}</h3>
      <div className="space-y-6">
        <div>
          <strong className="block text-sm font-black uppercase tracking-widest text-emerald-600 mb-2">When to use</strong>
          <p className="text-lg font-medium text-slate-700">{whenToUse}</p>
        </div>
        <div>
          <strong className="block text-sm font-black uppercase tracking-widest text-blue-600 mb-2">Risk reduced</strong>
          <p className="text-lg font-medium text-slate-700">{riskReduced}</p>
        </div>
        <div>
          <strong className="block text-sm font-black uppercase tracking-widest text-amber-600 mb-2">Trade-offs</strong>
          <p className="text-lg font-medium text-slate-700">{tradeoffs}</p>
        </div>
      </div>
    </div>
  );
}

export function EvidenceAccordion({ items }: { items: { title: string; url?: string; excerpt: string; date: string }[] }) {
  const [expanded, setExpanded] = useState(false);

  if (!items || items.length === 0) return null;

  return (
    <div className="border-2 border-slate-200 rounded-2xl bg-white overflow-hidden my-16">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-8 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <FileText className="w-8 h-8 text-slate-500" />
          <span className="font-black text-slate-900 text-2xl">How do we know? ({items.length} Official Sources)</span>
        </div>
        <ChevronDown className={cn("w-8 h-8 text-slate-400 transition-transform", expanded && "rotate-180")} />
      </button>
      
      {expanded && (
        <div className="divide-y-2 divide-slate-100">
          {items.map((item, i) => (
            <div key={i} className="p-8">
              <div className="flex justify-between items-start mb-6 gap-6">
                <div>
                  <span className="block font-bold text-slate-900 text-xl mb-2">{item.title}</span>
                  <span className="text-sm font-bold text-slate-500 tracking-wider">Last verified: {item.date}</span>
                </div>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors shrink-0">
                    <LinkIcon className="w-4 h-4 mr-2" /> View Source
                  </a>
                )}
              </div>
              <blockquote className="pl-6 border-l-4 border-slate-900 py-2 text-xl font-medium text-slate-800 bg-slate-50 p-6 rounded-r-xl italic leading-relaxed">
                &quot;{item.excerpt}&quot;
              </blockquote>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function NextSurvivalGuides({ platforms }: { platforms: { name: string; slug: string; riskLevel: string; category: string }[] }) {
  if (!platforms || platforms.length === 0) return null;
  return (
    <div className="my-24 border-t-2 border-slate-100 pt-16">
      <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-4">Check another platform before you depend on it</h2>
      <p className="text-xl text-slate-600 font-medium mb-10">We translate policy fine print into operational risk for top business platforms.</p>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {platforms.map(p => (
          <Link key={p.slug} href={`/platforms/${p.slug}`} className="block group">
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-8 hover:border-slate-900 hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] transition-all h-full flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">{p.name}</h3>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">{p.category.replace(/_/g, ' ')}</p>
              </div>
              <div className="flex items-center justify-between mt-4">
                <RiskBadge level={p.riskLevel} />
                <ArrowRight className="w-6 h-6 text-slate-300 group-hover:text-slate-900 transition-colors" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function EditorialMethodology() {
  return (
    <aside className="bg-slate-900 text-white rounded-2xl p-10 my-16">
      <div className="flex flex-col sm:flex-row items-start gap-8">
        <div className="bg-white/10 p-4 rounded-xl shrink-0">
          <Info className="w-8 h-8 text-white" />
        </div>
        <div className="text-lg text-slate-300 leading-relaxed font-medium">
          <strong className="block text-white text-xl font-bold mb-3 tracking-wide uppercase">Editorial Methodology</strong>
          PoliBrawl reviews official platform policies and turns operational risk clauses into practical survival guidance. We are independent, not affiliated with the platforms we cover, and this content is not legal advice. Our mission is pure operational survival.
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
    <aside className="hidden lg:block w-72 shrink-0 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-8 pb-12">
      <nav className="space-y-2 text-base font-bold">
        {links.map((link) => (
          <Link
            key={link.id}
            href={`#${link.id}`}
            className={cn(
              "block px-4 py-3 rounded-lg transition-colors border-l-4",
              activeId === link.id
                ? "bg-slate-100 text-slate-900 border-slate-900"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-transparent"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
