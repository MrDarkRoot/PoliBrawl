"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink, ShieldAlert, CheckSquare, TriangleAlert, Info, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { RiskBadge } from "@/components/public/layout";

export function PlatformHero({
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
            <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              {category}
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <RiskBadge level={riskLevel} />
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="text-xs text-slate-400">Reviewed {lastReviewed}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
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
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 mt-2")}
          >
            Official Website
            <ExternalLink className="ml-2 h-3.5 w-3.5" aria-hidden="true" />
          </a>
        )}
      </div>
    </header>
  );
}

export function TLDRBox({ points }: { points: string[] }) {
  if (!points || points.length === 0) return null;
  return (
    <section className="bg-slate-50 border border-slate-200 rounded-xl p-6 my-10">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500 mb-4 flex items-center">
        <ShieldAlert className="w-4 h-4 mr-2" />
        TL;DR
      </h2>
      <ul className="space-y-3">
        {points.map((pt, i) => (
          <li key={i} className="flex items-start text-slate-700 leading-relaxed">
            <span className="mr-3 text-slate-400 mt-0.5 font-bold">•</span>
            <span>{pt}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RiskCard({
  title,
  severity,
  summary,
  href,
}: {
  title: string;
  severity: string;
  summary: string;
  href: string;
}) {
  return (
    <a href={href} className="block group outline-none h-full">
      <article className="bg-white border border-slate-200 rounded-xl p-6 transition-all hover:shadow-md hover:border-slate-300 h-full flex flex-col focus-visible:ring-2 focus-visible:ring-slate-900">
        <div className="flex items-center justify-between mb-4">
          <RiskBadge level={severity} />
        </div>
        <h3 className="font-semibold text-lg text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
          {title}
        </h3>
        <p className="text-sm text-slate-600 line-clamp-3 mb-4 flex-1 leading-relaxed">
          {summary}
        </p>
        <div className="text-sm font-medium text-blue-600 flex items-center mt-auto">
          Read more <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
        </div>
      </article>
    </a>
  );
}

export function AffectedUsers({ types }: { types: string[] }) {
  if (!types || types.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {types.map((type, i) => (
        <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium border border-slate-200">
          {type}
        </span>
      ))}
    </div>
  );
}

export function ChecklistCard({ title, items }: { title: string; items: { label: string; required: boolean }[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 mb-4">
      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
        <CheckSquare className="w-5 h-5 mr-2 text-emerald-500" />
        {title}
      </h3>
      <ul className="space-y-4">
        {items.map((item, i) => (
          <li key={i} className="flex items-start">
            <div className="w-4 h-4 rounded border border-slate-300 mt-1 mr-3 flex-shrink-0 bg-slate-50" />
            <span className="text-slate-700 leading-relaxed text-sm">
              {item.label}
              {item.required && <span className="text-red-500 ml-1" title="Required">*</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BackupOptionCard({
  name,
  type,
  summary,
  tradeoffs,
}: {
  name: string;
  type: string;
  summary: string;
  tradeoffs: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 mb-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <h3 className="font-semibold text-slate-900">{name}</h3>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded capitalize">
          {type.replace(/_/g, " ")}
        </span>
      </div>
      <p className="text-sm text-slate-600 mb-4">{summary}</p>
      {tradeoffs && (
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 text-sm">
          <strong className="text-slate-700 block mb-1">Trade-offs</strong>
          <span className="text-slate-600 leading-relaxed">{tradeoffs}</span>
        </div>
      )}
    </div>
  );
}

export function EvidenceCard({
  sourceTitle,
  sourceUrl,
  excerpt,
  date,
}: {
  sourceTitle: string;
  sourceUrl?: string;
  excerpt: string;
  date: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden my-4 transition-all">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-700 text-sm">Official Source Evidence</span>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", expanded && "rotate-180")} />
      </button>
      
      {expanded && (
        <div className="p-5 border-t border-slate-200">
          <div className="flex justify-between items-start mb-4 gap-4">
            <div>
              <span className="block font-semibold text-slate-900 text-sm mb-1">{sourceTitle}</span>
              <span className="text-xs text-slate-500">Captured: {date}</span>
            </div>
            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-blue-600 hover:underline text-xs flex items-center whitespace-nowrap"
              >
                View Source <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            )}
          </div>
          <blockquote className="border-l-2 border-slate-300 pl-4 py-1 text-sm italic text-slate-700 leading-relaxed">
            &quot;{excerpt}&quot;
          </blockquote>
        </div>
      )}
    </div>
  );
}

export function DetailedRedFlagCard({
  title,
  severity,
  summary,
  category,
  survivalNote,
  evidence,
}: {
  title: string;
  severity: string;
  summary: string;
  category: string;
  survivalNote?: string;
  evidence?: { title: string; url: string; excerpt: string; date: string; }
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm" id={title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}>
      <div className="flex items-center gap-3 mb-4">
        <RiskBadge level={severity} />
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{category}</span>
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-3 leading-snug">{title}</h3>
      <p className="text-slate-600 leading-relaxed mb-6">{summary}</p>
      
      {survivalNote && (
        <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-5 mb-6">
          <h4 className="flex items-center text-sm font-semibold text-blue-900 mb-2">
            <TriangleAlert className="w-4 h-4 mr-2" /> Survival Strategy
          </h4>
          <p className="text-sm text-blue-800/90 leading-relaxed">{survivalNote}</p>
        </div>
      )}
      
      {evidence && (
        <EvidenceCard 
          sourceTitle={evidence.title}
          sourceUrl={evidence.url}
          excerpt={evidence.excerpt}
          date={evidence.date}
        />
      )}
    </div>
  );
}

export function EditorialCallout({ children }: { children: React.ReactNode }) {
  return (
    <aside className="bg-slate-50 border border-slate-200 rounded-xl p-6 my-10">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
        <div className="text-sm text-slate-600 leading-relaxed">
          {children}
        </div>
      </div>
    </aside>
  );
}
