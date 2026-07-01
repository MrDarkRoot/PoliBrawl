const unsafePhrases = [
  "always",
  "never",
  "guarantees",
  "proves",
  "illegal",
  "fraudulent",
  "scam",
  "everyone",
];

export function getSafeWordingWarnings(values: {
  explanation?: string | null;
  whyItMatters?: string | null;
}) {
  const content = [values.explanation, values.whyItMatters]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return unsafePhrases
    .filter((phrase) => content.includes(phrase))
    .map((phrase) => `Avoid unsupported absolute phrasing such as "${phrase}".`);
}
