"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Box, ShieldAlert, Clock, Info, Copy, Check, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

// --- FEATURE 1: Stack Profiler (Client Component for interactive state) ---
export function StackProfiler({
  platforms
}: {
  platforms: { id: string; name: string; slug: string; category: string; main_level: string | null }[];
}) {
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);

  const togglePlatform = (slug: string) => {
    setSelectedSlugs(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  const selectedCount = selectedSlugs.length;
  const selectedPlatforms = platforms.filter(p => selectedSlugs.includes(p.slug));
  const hasHighRisk = selectedPlatforms.some(p => p.main_level === 'high' || p.main_level === 'critical');

  return (
    <div className="bg-slate-900 border-t-2 border-slate-900 py-24 text-white">
      <div className="mx-auto max-w-[90rem] px-4 lg:px-8">
        <div className="max-w-4xl mb-12">
          <h2 className="text-4xl font-black mb-4">What platforms does your business depend on?</h2>
          <p className="text-xl text-slate-400 font-medium">Pick the tools you rely on. PoliBrawl will show which platform risks to review first.</p>
        </div>

        <div className="flex flex-wrap gap-4 mb-12">
          {platforms.map(p => {
            const isSelected = selectedSlugs.includes(p.slug);
            return (
              <button
                key={p.slug}
                onClick={() => togglePlatform(p.slug)}
                className={cn(
                  "px-6 py-4 rounded-xl border-2 font-bold text-lg transition-all",
                  isSelected
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-700"
                )}
              >
                {p.name}
              </button>
            );
          })}
        </div>

        {selectedCount > 0 && (
          <div className="bg-slate-800 border-2 border-slate-700 p-8 rounded-2xl animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-2xl font-black mb-4 flex items-center">
              <Box className="w-6 h-6 mr-3 text-blue-400" /> Your Stack Profile
            </h3>
            <p className="text-lg text-slate-300 mb-6">
              You selected {selectedCount} platform{selectedCount > 1 ? 's' : ''}. 
              {hasHighRisk 
                ? " This stack contains high-severity dependency risks, including potential funds holding or account termination without warning."
                : " Review the operational guidelines to ensure your backup rails are ready."}
            </p>
            <div className="flex flex-wrap gap-4">
              {selectedPlatforms.map(p => (
                <Link
                  key={p.slug}
                  href={`/platforms/${p.slug}`}
                  className="bg-slate-900 border border-slate-600 px-4 py-2 rounded-lg text-slate-200 hover:border-blue-400 transition-colors flex items-center font-bold"
                >
                  Review {p.name} <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- FEATURE 2: Platform DNA ---
export function DNAMeter({ label, level, reason }: { label: string; level: string; reason: string }) {
  const score = level === 'High' ? 3 : level === 'Medium' ? 2 : level === 'Low' ? 1 : 0;
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-end mb-2">
        <span className="font-bold text-slate-900">{label}</span>
        <span className={cn(
          "text-sm font-black uppercase tracking-wider",
          score === 3 ? "text-red-600" : score === 2 ? "text-amber-600" : score === 1 ? "text-emerald-600" : "text-slate-400"
        )}>
          {level}
        </span>
      </div>
      <div className="flex gap-1 h-3 mb-2">
        <div className={cn("flex-1 rounded-l-full", score >= 1 ? (score === 3 ? "bg-red-500" : score === 2 ? "bg-amber-500" : "bg-emerald-500") : "bg-slate-200")} />
        <div className={cn("flex-1", score >= 2 ? (score === 3 ? "bg-red-500" : "bg-amber-500") : "bg-slate-200")} />
        <div className={cn("flex-1 rounded-r-full", score >= 3 ? "bg-red-500" : "bg-slate-200")} />
      </div>
      <p className="text-sm text-slate-600 leading-snug">{reason}</p>
    </div>
  );
}

export function PlatformDNA({
  redFlags
}: {
  redFlags: { category: string; level: string; title: string }[]
}) {
  const hasCategory = (cat: string) => redFlags.some(rf => rf.category === cat || rf.category?.includes(cat));
  const getLevel = (cat: string) => {
    const flags = redFlags.filter(rf => rf.category === cat || rf.category?.includes(cat));
    if (flags.some(rf => rf.level === 'critical' || rf.level === 'high')) return 'High';
    if (flags.some(rf => rf.level === 'medium')) return 'Medium';
    if (flags.length > 0) return 'Low';
    return 'Unknown';
  };

  const moneyLevel = getLevel('money');
  const accountLevel = getLevel('account');
  const kycLevel = getLevel('kyc');
  const appealLevel = getLevel('appeal');
  
  // Custom logic to combine missing labels
  const getReason = (level: string, defaultReason: string) => level !== 'Unknown' ? defaultReason : "Not enough evidence yet.";

  return (
    <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-8 mb-12">
      <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center">
        <Activity className="w-6 h-6 mr-3 text-blue-600" /> Platform DNA
      </h3>
      <div className="grid md:grid-cols-2 gap-x-12 gap-y-2">
        <DNAMeter 
          label="Money Control" 
          level={moneyLevel} 
          reason={getReason(moneyLevel, "Published red flags mention funds hold, reserve, payout delay, or balance access.")} 
        />
        <DNAMeter 
          label="Account Control" 
          level={accountLevel} 
          reason={getReason(accountLevel, "Published red flags mention suspension, limitation, or termination.")} 
        />
        <DNAMeter 
          label="Verification Burden" 
          level={kycLevel} 
          reason={getReason(kycLevel, "Platform heavily scrutinizes identity, UBOs, or source of funds.")} 
        />
        <DNAMeter 
          label="Recovery Friction" 
          level={appealLevel} 
          reason={getReason(appealLevel, "Appeals are automated or lack direct human support paths.")} 
        />
      </div>
    </div>
  );
}

// --- FEATURE 3: Related Guides Loop ---
export function RelatedGuidesLoop({
  currentPlatformName,
  relatedPlatforms
}: {
  currentPlatformName: string;
  relatedPlatforms: { slug: string; name: string; category: string; riskLevel: string }[];
}) {
  if (relatedPlatforms.length === 0) return null;

  return (
    <div className="mt-24 border-t-2 border-slate-900 pt-16">
      <h2 className="text-4xl font-black text-slate-900 mb-4">Check another platform before you depend on it</h2>
      <p className="text-xl text-slate-600 mb-12 font-medium">Platform policies are a web. Don&apos;t leave your backup rails exposed.</p>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {relatedPlatforms.map(p => (
          <Link key={p.slug} href={`/platforms/${p.slug}`} className="block group">
            <div className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-slate-900 hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition-all h-full flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">{p.name}</h3>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">{p.category.replace(/_/g, ' ')}</p>
              </div>
              <div className="flex items-center text-blue-600 font-bold group-hover:translate-x-2 transition-transform">
                Open survival guide <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// --- FEATURE 4: Risk Concept Rabbit Holes ---
export function RiskConceptLinks() {
  const concepts = [
    "Funds hold", "Reserve", "Account limitation", 
    "KYC review", "Payout delay", "Business continuity"
  ];
  return (
    <div className="my-12">
      <h3 className="text-lg font-black uppercase tracking-widest text-slate-500 mb-6">Related risk concepts</h3>
      <div className="flex flex-wrap gap-3">
        {concepts.map(c => (
          <span 
            key={c}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-full border border-slate-200 text-sm"
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

// --- FEATURE 5: Policy Freshness / Timeline ---
export function PolicyFreshnessBlock({
  lastReviewed,
  evidenceCount,
  redFlagCount
}: {
  lastReviewed: string;
  evidenceCount: number;
  redFlagCount: number;
}) {
  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 my-12 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
      <div className="flex items-start gap-4">
        <Clock className="w-8 h-8 text-blue-500 shrink-0 mt-1" />
        <div>
          <h3 className="text-lg font-black text-blue-950 mb-1">Policy Freshness</h3>
          <p className="text-sm text-blue-800 font-medium">This guide should be rechecked when official terms change.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-6 sm:text-right">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-blue-500">Last Reviewed</div>
          <div className="text-lg font-black text-blue-950">{lastReviewed}</div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-blue-500">Evidence</div>
          <div className="text-lg font-black text-blue-950">{evidenceCount} items</div>
        </div>
      </div>
    </div>
  );
}

// --- FEATURE 6: Shareable Warning Snippet ---
export function CopyWarningButton({
  platformName,
  riskTitle,
  whyItMatters,
  url
}: {
  platformName: string;
  riskTitle: string;
  whyItMatters: string;
  url: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = `Team note: ${platformName} has a "${riskTitle}" risk.

Why it matters:
${whyItMatters}

Action:
Keep a backup rail and review the survival checklist.

Source:
${url}`;
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button 
      onClick={handleCopy}
      className={cn(
        "mt-6 inline-flex items-center px-4 py-2 rounded-lg font-bold text-sm transition-colors border-2",
        copied ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
      )}
    >
      {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
      {copied ? "Copied to clipboard" : "Copy team warning"}
    </button>
  );
}
