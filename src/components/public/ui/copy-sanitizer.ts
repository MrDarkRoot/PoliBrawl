export function sanitizePublicCopy(text: string | null | undefined): string {
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
  ];

  for (const phrase of forbiddenPhrases) {
    if (lower.includes(phrase)) {
      return "This risk is being reviewed by the PoliBrawl editorial team.";
    }
  }

  return text;
}
