import type { RedFlag } from "@/types/polibrawl";

type PublicRedFlagFields = Pick<
  RedFlag,
  "id" | "platform_id" | "slug" | "title" | "category" | "level" | "summary" | "why_it_matters"
>;

export type PublicRedFlagDetail = PublicRedFlagFields;

export type PublicPageRedFlag = PublicRedFlagFields & {
  section_label: string | null;
};

export type PublicPlatformDnaFlag = Pick<PublicPageRedFlag, "category" | "level" | "title">;

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
