import type { PlatformGuideDraft, RedFlagDraft } from "./editorial-draft-builder.service";

export function buildPlatformGuideMarkdown(draft: PlatformGuideDraft): string {
  let md = `# ${draft.title}\n\n`;

  md += `## Executive Summary\n\n${draft.executiveSummary}\n\n`;
  
  md += `## TL;DR\n\n`;
  draft.tldr.forEach(point => {
    md += `- ${point}\n`;
  });
  md += `\n`;

  md += `## Who Should Read This\n\n`;
  draft.whoShouldRead.forEach(aud => {
    md += `- ${aud}\n`;
  });
  md += `\n`;

  md += `## Key Risks\n\n`;
  draft.riskSections.forEach(risk => {
    md += `### ${risk.title}\n`;
    md += `**Severity:** ${risk.severity}\n\n`;
    md += `**Explanation:** ${risk.explanation}\n\n`;
    md += `**Typical Situations:** ${risk.typicalSituations}\n\n`;
    md += `**Operational Impact:** ${risk.operationalImpact}\n\n`;
  });

  md += `## Survival Strategy\n\n${draft.survivalStrategy}\n\n`;

  md += `## Action Checklist\n\n`;
  draft.actionChecklist.forEach(item => {
    md += `- [ ] ${item}\n`;
  });
  md += `\n`;

  md += `## Backup Options\n\n`;
  draft.backupOptions.forEach(opt => {
    md += `- ${opt}\n`;
  });
  md += `\n`;

  md += `## Evidence\n\n`;
  draft.evidenceReferences.forEach(ev => {
    md += `- ${ev.title} (Source: ${ev.sourceUrl || 'Unknown'})\n`;
  });
  md += `\n`;

  md += `## Editorial Methodology\n\n${draft.methodology}\n`;

  return md;
}

export function buildRedFlagMarkdown(draft: RedFlagDraft): string {
  let md = `# ${draft.headline}\n\n`;
  md += `## Summary\n\n${draft.summary}\n\n`;
  md += `## Why it Matters\n\n${draft.whyItMatters}\n\n`;
  md += `## Who is Affected\n\n${draft.whoIsAffected.join(', ')}\n\n`;
  md += `## Real-World Scenario\n\n${draft.realWorldScenario}\n\n`;
  md += `## Survival Advice\n\n${draft.survivalAdvice}\n\n`;
  md += `## Checklist\n\n`;
  draft.checklist.forEach(c => md += `- [ ] ${c}\n`);
  md += `\n## Alternatives\n\n`;
  draft.alternatives.forEach(a => md += `- ${a}\n`);
  md += `\n## Editorial Disclaimer\n\nEvidence-first. Not legal advice.\n`;
  return md;
}
