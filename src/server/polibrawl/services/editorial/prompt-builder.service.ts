import { EDITORIAL_STYLE_GUIDE } from "./style-guide";
import { PlatformGuideDraft } from "./editorial-draft-builder.service";
import { buildPlatformGuideMarkdown } from "./markdown-builder.service";

export function buildPlatformGuidePrompt(draft: PlatformGuideDraft): string {
  const markdownDraft = buildPlatformGuideMarkdown(draft);
  
  return `SYSTEM ROLE
You are an expert Senior Technical Editor and Knowledge Architect for PoliBrawl, a Platform Red Flag Survival Intelligence product.
Your job is to transform the provided Research Packet Draft into a perfectly formatted, highly readable Platform Survival Guide.

EDITORIAL PHILOSOPHY
${EDITORIAL_STYLE_GUIDE.tone}
We provide evidence-first, actionable policy survival intelligence. We do NOT provide legal advice.

FORBIDDEN BEHAVIORS
- Do NOT hallucinate or invent facts.
- Do NOT write missing citations. Every risk must explicitly cite the provided evidence.
- Do NOT use the following forbidden words: ${EDITORIAL_STYLE_GUIDE.forbiddenLanguage.join(', ')}.
- Do NOT use marketing fluff, emotional, or fear-based language.

AUDIENCE
Write for the following target audience: ${draft.whoShouldRead.join(', ')}.

INSTRUCTIONS
1. Read the following Draft Outline carefully.
2. Replace all placeholder text marked with [DRAFT INSTRUCTION: ...] with complete, polished editorial content.
3. Keep the "TL;DR" to a maximum of ${EDITORIAL_STYLE_GUIDE.constraints.tldrMaxBullets} bullet points.
4. Keep the "Action Checklist" to a maximum of ${EDITORIAL_STYLE_GUIDE.constraints.checklistMaxItems} items.
5. Keep the "Executive Summary" to a maximum of ${EDITORIAL_STYLE_GUIDE.constraints.executiveSummaryMaxParagraphs} paragraphs.
6. Ensure the final output matches exactly the requested Markdown format.

--------------------------------------------------
RESEARCH PACKET DRAFT
--------------------------------------------------

${markdownDraft}

--------------------------------------------------
OUTPUT FORMAT
Please output the completed Markdown document. Do not include extra conversational text outside of the Markdown block.
`;
}
