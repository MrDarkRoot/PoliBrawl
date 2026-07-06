import { EDITORIAL_STYLE_GUIDE } from "./style-guide";

export interface ValidationResult {
  status: "PASS" | "FAIL";
  issues: string[];
}

export function validateEditorialDraft(markdown: string): ValidationResult {
  const issues: string[] = [];

  // Check required sections
  const requiredHeadings = [
    "## Executive Summary",
    "## Action Checklist",
    "## Evidence",
    "## Survival Strategy",
    "## Backup Options",
  ];

  requiredHeadings.forEach(heading => {
    if (!markdown.includes(heading)) {
      issues.push(`Missing required section: ${heading.replace("## ", "")}`);
    }
  });

  // Check summary length (heuristics: at least 150 chars after the heading)
  const execSummaryMatch = markdown.match(/## Executive Summary\n\n([\s\S]*?)\n\n##/);
  if (execSummaryMatch) {
    const summaryText = execSummaryMatch[1].trim();
    if (summaryText.length < 100) {
      issues.push("Executive Summary is too short. Must be at least 100 characters.");
    }
  }

  // Check forbidden language (marketing, emotional, legal conclusions)
  const forbiddenFound = EDITORIAL_STYLE_GUIDE.forbiddenLanguage.filter(word => 
    new RegExp(`\\b${word}\\b`, 'i').test(markdown)
  );

  if (forbiddenFound.length > 0) {
    issues.push(`Contains forbidden/emotional/legal language: ${forbiddenFound.join(', ')}`);
  }

  // Check marketing language heuristics
  const marketingWords = ["revolutionary", "groundbreaking", "amazing", "incredible", "perfect", "seamless"];
  const marketingFound = marketingWords.filter(word => 
    new RegExp(`\\b${word}\\b`, 'i').test(markdown)
  );
  if (marketingFound.length > 0) {
    issues.push(`Contains marketing fluff: ${marketingFound.join(', ')}`);
  }

  // Very basic passive voice heuristic (was/were/is/are + ending in 'ed')
  const passiveRegex = /\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi;
  const passiveMatches = markdown.match(passiveRegex);
  if (passiveMatches && passiveMatches.length > 15) {
    issues.push(`Too many passive sentences detected (${passiveMatches.length}). Use active voice.`);
  }

  // Unsupported claims (heuristic: looking for "always", "never" which are forbidden, handled above)
  
  if (issues.length === 0) {
    return { status: "PASS", issues: [] };
  }

  return { status: "FAIL", issues };
}
