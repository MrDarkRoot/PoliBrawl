import "server-only";

import { createContentHash } from "@/server/services/versioning/version-manager";
import { replaceClauses, replaceSections } from "@/server/repositories/document-repository";

type SectionDraft = {
  heading: string | null;
  sectionText: string;
  anchor: string | null;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseSections(markdownText: string): SectionDraft[] {
  const lines = markdownText.split(/\r?\n/);
  const sections: SectionDraft[] = [];

  let currentHeading: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (!buffer.length && !currentHeading) {
      return;
    }

    sections.push({
      heading: currentHeading,
      sectionText: buffer.join("\n").trim(),
      anchor: currentHeading ? slugify(currentHeading) : null,
    });
    buffer = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,6}\s+(.*)$/);
    if (headingMatch) {
      flush();
      currentHeading = headingMatch[1].trim();
      continue;
    }
    buffer.push(line);
  }

  flush();

  if (!sections.length) {
    return [
      {
        heading: null,
        sectionText: markdownText,
        anchor: null,
      },
    ];
  }

  return sections;
}

function splitClauses(text: string) {
  return text
    .split(/\n{2,}/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function processDocumentVersion(input: {
  versionId: string;
  markdownText: string;
}) {
  const sectionDrafts = parseSections(input.markdownText);
  const storedSections = await replaceSections(
    input.versionId,
    sectionDrafts.map((section, index) => ({
      heading: section.heading,
      section_order: index,
      section_text: section.sectionText,
      anchor: section.anchor,
    })),
  );

  const clauses = storedSections.flatMap((section, sectionIndex) => {
    const sourceText =
      sectionDrafts[sectionIndex]?.sectionText ?? section.section_text ?? "";

    return splitClauses(sourceText).map((clauseText, clauseIndex) => ({
      section_id: section.id,
      clause_order: sectionIndex * 1000 + clauseIndex,
      clause_text: clauseText,
      clause_hash: createContentHash(clauseText),
      word_count: clauseText.split(/\s+/).filter(Boolean).length,
    }));
  });

  const storedClauses = await replaceClauses(input.versionId, clauses);

  return {
    sections: storedSections,
    clauses: storedClauses,
  };
}
