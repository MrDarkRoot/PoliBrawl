export function sanitizePublicCopy(text: string | null | undefined, context: 'hero' | 'summary' | 'action' = 'summary'): string {
  if (!text) return "";

  const lower = text.toLowerCase();
  const forbiddenPhrases = [
    "minimum length",
    "constraint",
    "placeholder",
    "generated",
    "analysis reveals",
    "summary needs",
    "policy document",
    "critical control regarding",
    "database",
    "candidate",
    "scanner",
    "research packet",
    "noise score",
    "confidence score",
    "summary meets the",
    "being reviewed by the polibrawl editorial team",
    "official survival overview",
    "editorial team",
  ];

  for (const phrase of forbiddenPhrases) {
    if (lower.includes(phrase)) {
      if (context === 'hero') {
        return "Understand the operational risks, preparation steps, and official policy evidence before depending on this platform.";
      }
      if (context === 'summary') {
        return "This policy area may affect account access, payout timing, or operational continuity. Review the official evidence and prepare backup options before problems occur.";
      }
      return "Ensure your operations comply with the platform's standard requirements to avoid disruption.";
    }
  }

  return text;
}
