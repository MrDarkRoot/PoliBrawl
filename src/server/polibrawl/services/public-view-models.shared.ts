import { isSafeHttpUrl } from "@/features/shared/schemas/http-url";
import type { PolicyChange, RedFlag } from "@/types/polibrawl";

type PublicRedFlagFields = Pick<
  RedFlag,
  "id" | "platform_id" | "slug" | "title" | "category" | "level" | "summary" | "why_it_matters"
>;

export type PublicRedFlagDetail = PublicRedFlagFields;

export type PublicPageRedFlag = PublicRedFlagFields & {
  section_label: string | null;
};

export type PublicPlatformDnaFlag = Pick<PublicPageRedFlag, "category" | "level" | "title">;

type PublicPolicyChangeFields = Pick<
  PolicyChange,
  | "id"
  | "change_type"
  | "summary"
  | "impact_level"
  | "what_changed"
  | "who_is_affected"
  | "why_it_matters"
  | "what_to_do"
  | "reviewed_at"
  | "published_at"
> & {
  platform_name: string;
  platform_slug: string;
  source_title: string | null;
  source_url: string | null;
  old_snapshot_title: string | null;
  old_snapshot_captured_at: string | null;
  new_snapshot_title: string | null;
  new_snapshot_captured_at: string | null;
};

export type PublicPolicyChangeListItem = Pick<
  PublicPolicyChangeFields,
  | "id"
  | "change_type"
  | "summary"
  | "impact_level"
  | "reviewed_at"
  | "published_at"
  | "platform_name"
  | "platform_slug"
  | "source_title"
>;

export type PublicPolicyChangeDetail = PublicPolicyChangeFields;

function toSafePublicUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return isSafeHttpUrl(value) ? value : null;
}

export function toPublicRedFlagDetail(redFlag: PublicRedFlagFields): PublicRedFlagDetail {
  return {
    id: redFlag.id,
    platform_id: redFlag.platform_id,
    slug: redFlag.slug,
    title: redFlag.title,
    category: redFlag.category,
    level: redFlag.level,
    summary: redFlag.summary,
    why_it_matters: redFlag.why_it_matters,
  };
}

export function toPublicPageRedFlag(
  redFlag: PublicRedFlagFields & { section_label?: string | null },
): PublicPageRedFlag {
  return {
    ...toPublicRedFlagDetail(redFlag),
    section_label: redFlag.section_label ?? null,
  };
}

export function toPublicPlatformDnaFlags(
  redFlags: Array<Pick<PublicPageRedFlag, "category" | "level" | "title">>,
): PublicPlatformDnaFlag[] {
  return redFlags.map((redFlag) => ({
    category: redFlag.category,
    level: redFlag.level,
    title: redFlag.title,
  }));
}

export function toPublicPolicyChangeListItem(
  change: PublicPolicyChangeFields,
): PublicPolicyChangeListItem {
  return {
    id: change.id,
    change_type: change.change_type,
    summary: change.summary,
    impact_level: change.impact_level,
    reviewed_at: change.reviewed_at,
    published_at: change.published_at,
    platform_name: change.platform_name,
    platform_slug: change.platform_slug,
    source_title: change.source_title,
  };
}

export function toPublicPolicyChangeDetail(
  change: PublicPolicyChangeFields,
): PublicPolicyChangeDetail {
  return {
    ...toPublicPolicyChangeListItem(change),
    what_changed: change.what_changed,
    who_is_affected: [...change.who_is_affected],
    why_it_matters: change.why_it_matters,
    what_to_do: [...change.what_to_do],
    source_url: toSafePublicUrl(change.source_url),
    old_snapshot_title: change.old_snapshot_title,
    old_snapshot_captured_at: change.old_snapshot_captured_at,
    new_snapshot_title: change.new_snapshot_title,
    new_snapshot_captured_at: change.new_snapshot_captured_at,
  };
}
