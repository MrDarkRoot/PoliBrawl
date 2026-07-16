import type { EditorialDraftBackupOption } from "@/types/polibrawl";

import {
  formatLinesForTextarea,
  splitTextareaLines,
} from "@/features/platform-intelligence/intelligence-formats";

export { formatLinesForTextarea, splitTextareaLines };

export function parseBackupOptionsInput(
  value: string | null | undefined,
): EditorialDraftBackupOption[] {
  return splitTextareaLines(value).map((line) => {
    const [rawLabel, ...rest] = line.split("|");
    return {
      label: rawLabel?.trim() ?? "",
      tradeoff: rest.join("|").trim(),
    };
  });
}

export function formatBackupOptionsForTextarea(
  values: EditorialDraftBackupOption[] | null | undefined,
) {
  return (values ?? [])
    .map((option) => `${option.label} | ${option.tradeoff}`)
    .join("\n");
}
