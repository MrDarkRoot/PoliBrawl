import "server-only";

import { createHash } from "node:crypto";

import {
  createDocumentVersion,
  createPolicyChange,
  getLatestVersionForSource,
  getVersionByHash,
  updateSourceHash,
} from "@/server/repositories/document-repository";

export function createContentHash(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

export async function createVersionIfChanged(input: {
  source: {
    id: string;
    platform_id: string;
    current_hash: string | null;
    monitor_enabled: boolean;
  };
  finalUrl?: string | null;
  markdownText: string;
  plainText: string;
  extractionMethod: string;
  extractionConfidence: number;
  effectiveDate?: string | null;
}) {
  const normalizedText = input.markdownText || input.plainText;
  const hash = createContentHash(normalizedText);

  const duplicate = await getVersionByHash(input.source.id, hash);
  if (duplicate) {
    await updateSourceHash({
      sourceId: input.source.id,
      currentHash: hash,
      finalUrl: input.finalUrl ?? null,
    });
    return {
      version: duplicate,
      created: false,
      hash,
    };
  }

  const latest = await getLatestVersionForSource(input.source.id);
  const version = await createDocumentVersion({
    policy_source_id: input.source.id,
    version_number: (latest?.version_number ?? 0) + 1,
    text_hash: hash,
    markdown_text: input.markdownText,
    plain_text: input.plainText,
    extraction_method: input.extractionMethod,
    extraction_confidence: input.extractionConfidence,
    effective_date: input.effectiveDate ?? null,
  });

  if (input.source.monitor_enabled && input.source.current_hash && input.source.current_hash !== hash) {
    await createPolicyChange({
      platform_id: input.source.platform_id,
      policy_source_id: input.source.id,
      old_version_id: latest?.id ?? null,
      new_version_id: version.id,
      old_hash: input.source.current_hash,
      new_hash: hash,
    });
  }

  await updateSourceHash({
    sourceId: input.source.id,
    currentHash: hash,
    finalUrl: input.finalUrl ?? null,
  });

  return {
    version,
    created: true,
    hash,
  };
}
