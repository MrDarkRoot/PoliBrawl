"use server";

import { requireAdminAccess } from "@/lib/auth";
import { buildPlatformGuideDraft } from "@/server/polibrawl/services/editorial/editorial-draft-builder.service";
import { buildPlatformGuideMarkdown } from "@/server/polibrawl/services/editorial/markdown-builder.service";
import { buildPlatformGuidePrompt } from "@/server/polibrawl/services/editorial/prompt-builder.service";
import { validateEditorialDraft } from "@/server/polibrawl/services/editorial/editorial-validator";
import type { Uuid } from "@/types/polibrawl";

export async function generateEditorialDraftAction(platformId: Uuid) {
  await requireAdminAccess();
  const draft = await buildPlatformGuideDraft(platformId);
  const markdown = buildPlatformGuideMarkdown(draft);
  const validation = validateEditorialDraft(markdown);
  return { draft, markdown, validation };
}

export async function generatePlatformGuidePromptAction(platformId: Uuid) {
  await requireAdminAccess();
  const draft = await buildPlatformGuideDraft(platformId);
  const prompt = buildPlatformGuidePrompt(draft);
  return prompt;
}
