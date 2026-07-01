import { formatDistanceToNow, parseISO } from "date-fns";

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatRelative(value: string | null | undefined) {
  if (!value) {
    return "Never";
  }

  return formatDistanceToNow(parseISO(value), { addSuffix: true });
}

export function toTitleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
