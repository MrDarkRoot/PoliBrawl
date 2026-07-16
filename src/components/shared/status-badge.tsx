import { Badge } from "@/components/ui/badge";
import { toTitleCase } from "@/lib/format";

const tones: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-900 hover:bg-emerald-100",
  approved: "bg-emerald-100 text-emerald-900 hover:bg-emerald-100",
  completed: "bg-emerald-100 text-emerald-900 hover:bg-emerald-100",
  running: "bg-sky-100 text-sky-900 hover:bg-sky-100",
  draft: "bg-zinc-100 text-zinc-900 hover:bg-zinc-100",
  pending: "bg-amber-100 text-amber-900 hover:bg-amber-100",
  published: "bg-emerald-100 text-emerald-900 hover:bg-emerald-100",
  keep: "bg-emerald-100 text-emerald-900 hover:bg-emerald-100",
  maybe: "bg-sky-100 text-sky-900 hover:bg-sky-100",
  drop: "bg-zinc-200 text-zinc-800 hover:bg-zinc-200",
  warning: "bg-orange-100 text-orange-900 hover:bg-orange-100",
  info: "bg-sky-100 text-sky-900 hover:bg-sky-100",
  needs_review: "bg-orange-100 text-orange-900 hover:bg-orange-100",
  review_requested: "bg-sky-100 text-sky-900 hover:bg-sky-100",
  rejected: "bg-rose-100 text-rose-900 hover:bg-rose-100",
  failed: "bg-rose-100 text-rose-900 hover:bg-rose-100",
  archived: "bg-zinc-200 text-zinc-800 hover:bg-zinc-200",
};

export function StatusBadge({ value }: { value: string | null | undefined }) {
  if (!value) {
    return <Badge variant="outline">Unknown</Badge>;
  }

  return <Badge className={tones[value] ?? "bg-zinc-100 text-zinc-900 hover:bg-zinc-100"}>{toTitleCase(value)}</Badge>;
}
