export const EDITORIAL_STYLE_GUIDE = {
  tone: "Neutral, evidence-first, professional, and actionable.",
  forbiddenLanguage: [
    "illegal",
    "scam",
    "fraud",
    "lawsuit",
    "you will lose your money",
    "terrifying",
    "dangerous",
    "always",
    "never",
  ],
  requiredSections: {
    platformGuide: [
      "Executive Summary",
      "TL;DR",
      "Who Should Read This",
      "Key Risks",
      "Survival Strategy",
      "Action Checklist",
      "Backup Options",
      "Evidence",
      "Editorial Methodology",
    ],
    redFlag: [
      "Headline",
      "Summary",
      "Why it Matters",
      "Who is Affected",
      "Real-World Scenario",
      "Survival Advice",
      "Checklist",
      "Alternatives",
      "Evidence",
      "Editorial Disclaimer",
    ],
  },
  audienceProfiles: {
    payment: ["Freelancer", "Agency", "SaaS", "Creator", "Marketplace"],
    creator_freelance: ["Freelancer", "Creator", "Agency", "Independent Contractor"],
    saas_developer: ["SaaS", "Developer", "Enterprise", "Startup", "Agency"],
  },
  constraints: {
    tldrMaxBullets: 5,
    checklistMaxItems: 8,
    executiveSummaryMaxParagraphs: 3,
  }
};
