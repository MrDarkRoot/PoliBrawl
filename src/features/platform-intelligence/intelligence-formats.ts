import type { RiskTimelineEvent } from "@/types/polibrawl";

export function splitTextareaLines(value: string | null | undefined) {
  return (value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function formatLinesForTextarea(values: string[] | null | undefined) {
  return (values ?? []).join("\n");
}

export function parseTimelineEventsInput(value: string | null | undefined): RiskTimelineEvent[] {
  return splitTextareaLines(value).map((line) => {
    const [rawLabel, ...rest] = line.split("|");
    const label = rawLabel?.trim() ?? "";
    const detail = rest.join("|").trim();

    return {
      label,
      detail,
    };
  });
}

export function formatTimelineEventsForTextarea(values: RiskTimelineEvent[] | null | undefined) {
  return (values ?? [])
    .map((event) => `${event.label} | ${event.detail}`)
    .join("\n");
}

export function formatDateTimeLocal(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const normalized = new Date(date.getTime() - offset * 60_000);
  return normalized.toISOString().slice(0, 16);
}

export function normalizeOptionalDatetime(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? new Date(trimmed).toISOString() : null;
}
