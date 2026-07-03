import { classifyDocumentFromContent } from "@/server/services/classification/content-classifier";
import { extractPolicyText } from "@/server/services/extraction/html";
import { htmlToMarkdown } from "@/server/services/extraction/markdown";

export function extractAndClassifyDocument(input: {
  html: string;
  url: string;
  title?: string | null;
}) {
  const extraction = extractPolicyText(input.html);
  const markdownText = htmlToMarkdown(extraction.mainHtml);
  const classification = classifyDocumentFromContent({
    url: input.url,
    title: input.title ?? null,
    markdownText,
    plainText: extraction.plainText,
  });

  return {
    markdownText,
    plainText: extraction.plainText,
    extractionConfidence: extraction.extractionConfidence,
    classification,
  };
}
