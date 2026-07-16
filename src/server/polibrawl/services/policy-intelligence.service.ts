import "server-only";

import { queryMany, queryOne } from "@/server/polibrawl/db";
import { evaluatePolicyChangePublication } from "@/server/polibrawl/services/policy-change-publication.shared";
import {
  toPublicPolicyChangeDetail,
  toPublicPolicyChangeListItem,
  type PublicPolicyChangeDetail,
  type PublicPolicyChangeListItem,
} from "@/server/polibrawl/services/public-view-models.shared";
import type { PolicyChange } from "@/types/polibrawl";

type PolicyChangeJoinedRow = PolicyChange & {
  platform_name: string;
  platform_slug: string;
  source_title: string | null;
  source_url: string | null;
  old_snapshot_title: string | null;
  old_snapshot_captured_at: string | null;
  new_snapshot_title: string | null;
  new_snapshot_captured_at: string | null;
};

export type DashboardWatchlistPlatform = {
  platform_id: string;
  name: string;
  slug: string;
  category: string;
  main_level: string | null;
  summary: string | null;
  followed_at: string;
  unread_alert_count: number;
  recent_change_count: number;
  latest_change_at: string | null;
};

export type DashboardPolicyAlert = PublicPolicyChangeListItem & {
  alert_id: string;
  alert_status: "unread" | "read";
  alert_created_at: string;
  read_at: string | null;
};

function mapJoinedPolicyChange(change: PolicyChangeJoinedRow) {
  return {
    ...change,
    platform_name: change.platform_name,
    platform_slug: change.platform_slug,
    source_title: change.source_title,
    source_url: change.source_url,
    old_snapshot_title: change.old_snapshot_title,
    old_snapshot_captured_at: change.old_snapshot_captured_at,
    new_snapshot_title: change.new_snapshot_title,
    new_snapshot_captured_at: change.new_snapshot_captured_at,
  };
}

async function listPublishedPolicyChangeRows(limit?: number, platformId?: string) {
  const values: unknown[] = [];
  const clauses = [
    `pc.published_status = 'published'`,
    `pc.archived_at is null`,
    `p.status = 'published'`,
    `p.archived_at is null`,
  ];

  if (platformId) {
    values.push(platformId);
    clauses.push(`pc.platform_id = $${values.length}`);
  }

  const limitClause = typeof limit === "number" ? ` limit $${values.length + 1}` : "";

  if (typeof limit === "number") {
    values.push(limit);
  }

  return queryMany<PolicyChangeJoinedRow>(
    `select
       pc.*,
       p.name as platform_name,
       p.slug as platform_slug,
       s.title as source_title,
       s.url as source_url,
       old_snap.title as old_snapshot_title,
       old_snap.captured_at::text as old_snapshot_captured_at,
       new_snap.title as new_snapshot_title,
       new_snap.captured_at::text as new_snapshot_captured_at
     from policy_changes pc
     join platforms p on p.id = pc.platform_id
     left join sources s on s.id = pc.source_id
     left join source_snapshots old_snap on old_snap.id = pc.old_snapshot_id
     left join source_snapshots new_snap on new_snap.id = pc.new_snapshot_id
     where ${clauses.join(" and ")}
     order by coalesce(pc.published_at, pc.reviewed_at, pc.created_at) desc, pc.updated_at desc${limitClause}`,
    values,
  );
}

function toVisibleListItems(
  rows: PolicyChangeJoinedRow[],
): PublicPolicyChangeListItem[] {
  return rows
    .filter((row) => evaluatePolicyChangePublication(row).ready)
    .map((row) => toPublicPolicyChangeListItem(mapJoinedPolicyChange(row)));
}

export async function getPublishedPolicyChanges(
  limit = 24,
): Promise<PublicPolicyChangeListItem[]> {
  const rows = await listPublishedPolicyChangeRows(limit);
  return toVisibleListItems(rows);
}

export async function getPublishedPolicyChangesByPlatform(
  platformId: string,
  limit = 3,
): Promise<PublicPolicyChangeListItem[]> {
  const rows = await listPublishedPolicyChangeRows(limit, platformId);
  return toVisibleListItems(rows);
}

export async function getPublishedPolicyChangeById(
  id: string,
): Promise<PublicPolicyChangeDetail | null> {
  const row = await queryOne<PolicyChangeJoinedRow>(
    `select
       pc.*,
       p.name as platform_name,
       p.slug as platform_slug,
       s.title as source_title,
       s.url as source_url,
       old_snap.title as old_snapshot_title,
       old_snap.captured_at::text as old_snapshot_captured_at,
       new_snap.title as new_snapshot_title,
       new_snap.captured_at::text as new_snapshot_captured_at
     from policy_changes pc
     join platforms p on p.id = pc.platform_id
     left join sources s on s.id = pc.source_id
     left join source_snapshots old_snap on old_snap.id = pc.old_snapshot_id
     left join source_snapshots new_snap on new_snap.id = pc.new_snapshot_id
     where pc.id = $1
       and pc.published_status = 'published'
       and pc.archived_at is null
       and p.status = 'published'
       and p.archived_at is null
     limit 1`,
    [id],
  );

  if (!row || !evaluatePolicyChangePublication(row).ready) {
    return null;
  }

  return toPublicPolicyChangeDetail(mapJoinedPolicyChange(row));
}

export async function syncPolicyAlertsForUser(
  userId: string,
  platformIds?: readonly string[],
) {
  const values: unknown[] = [userId];
  const platformClause =
    platformIds && platformIds.length > 0
      ? `and uw.platform_id = any($2)`
      : "";

  if (platformIds && platformIds.length > 0) {
    values.push(platformIds);
  }

  return queryMany<{ id: string }>(
    `insert into policy_alerts (user_id, policy_change_id)
     select
       $1,
       pc.id
     from user_platform_watchlist uw
     join policy_changes pc on pc.platform_id = uw.platform_id
     where uw.user_id = $1
       ${platformClause}
       and pc.published_status = 'published'
       and pc.archived_at is null
       and coalesce(pc.published_at, pc.reviewed_at, pc.created_at) >= uw.created_at
     on conflict (user_id, policy_change_id) do nothing
     returning id`,
    values,
  );
}

export async function getDashboardWatchlistPlatforms(userId: string) {
  const rows = await queryMany<{
    platform_id: string;
    name: string;
    slug: string;
    category: string;
    main_level: string | null;
    summary: string | null;
    followed_at: string;
    unread_alert_count: string;
    recent_change_count: string;
    latest_change_at: string | null;
  }>(
    `select
       uw.platform_id,
       p.name,
       p.slug,
       p.category,
       p.main_level,
       p.summary,
       uw.created_at::text as followed_at,
       count(distinct case when pa.status = 'unread' then pa.id end)::text as unread_alert_count,
       count(distinct pc.id)::text as recent_change_count,
       max(coalesce(pc.published_at, pc.reviewed_at, pc.created_at))::text as latest_change_at
     from user_platform_watchlist uw
     join platforms p on p.id = uw.platform_id
     left join policy_changes pc
       on pc.platform_id = p.id
      and pc.published_status = 'published'
      and pc.archived_at is null
      and coalesce(pc.published_at, pc.reviewed_at, pc.created_at) >= uw.created_at
     left join policy_alerts pa
       on pa.policy_change_id = pc.id
      and pa.user_id = uw.user_id
     where uw.user_id = $1
       and p.status = 'published'
       and p.archived_at is null
     group by uw.platform_id, p.name, p.slug, p.category, p.main_level, p.summary, uw.created_at
     order by max(coalesce(pc.published_at, pc.reviewed_at, pc.created_at)) desc nulls last, uw.created_at desc`,
    [userId],
  );

  return rows.map((row) => ({
    platform_id: row.platform_id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    main_level: row.main_level,
    summary: row.summary,
    followed_at: row.followed_at,
    unread_alert_count: Number(row.unread_alert_count),
    recent_change_count: Number(row.recent_change_count),
    latest_change_at: row.latest_change_at,
  })) satisfies DashboardWatchlistPlatform[];
}

export async function getDashboardRecentPolicyChanges(
  userId: string,
  limit = 12,
) {
  const rows = await queryMany<PolicyChangeJoinedRow>(
    `select
       pc.*,
       p.name as platform_name,
       p.slug as platform_slug,
       s.title as source_title,
       s.url as source_url,
       old_snap.title as old_snapshot_title,
       old_snap.captured_at::text as old_snapshot_captured_at,
       new_snap.title as new_snapshot_title,
       new_snap.captured_at::text as new_snapshot_captured_at
     from user_platform_watchlist uw
     join platforms p on p.id = uw.platform_id
     join policy_changes pc on pc.platform_id = p.id
     left join sources s on s.id = pc.source_id
     left join source_snapshots old_snap on old_snap.id = pc.old_snapshot_id
     left join source_snapshots new_snap on new_snap.id = pc.new_snapshot_id
     where uw.user_id = $1
       and pc.published_status = 'published'
       and pc.archived_at is null
       and p.status = 'published'
       and p.archived_at is null
       and coalesce(pc.published_at, pc.reviewed_at, pc.created_at) >= uw.created_at
     order by coalesce(pc.published_at, pc.reviewed_at, pc.created_at) desc, pc.updated_at desc
     limit $2`,
    [userId, limit],
  );

  return toVisibleListItems(rows);
}

export async function getDashboardPolicyAlerts(
  userId: string,
  limit = 12,
) {
  const rows = await queryMany<
    PolicyChangeJoinedRow & {
      alert_id: string;
      alert_status: "unread" | "read";
      alert_created_at: string;
      read_at: string | null;
    }
  >(
    `select
       pc.*,
       p.name as platform_name,
       p.slug as platform_slug,
       s.title as source_title,
       s.url as source_url,
       old_snap.title as old_snapshot_title,
       old_snap.captured_at::text as old_snapshot_captured_at,
       new_snap.title as new_snapshot_title,
       new_snap.captured_at::text as new_snapshot_captured_at,
       pa.id as alert_id,
       pa.status as alert_status,
       pa.created_at::text as alert_created_at,
       pa.read_at::text as read_at
     from policy_alerts pa
     join policy_changes pc on pc.id = pa.policy_change_id
     join platforms p on p.id = pc.platform_id
     left join sources s on s.id = pc.source_id
     left join source_snapshots old_snap on old_snap.id = pc.old_snapshot_id
     left join source_snapshots new_snap on new_snap.id = pc.new_snapshot_id
     where pa.user_id = $1
       and pc.published_status = 'published'
       and pc.archived_at is null
       and p.status = 'published'
       and p.archived_at is null
     order by pa.created_at desc
     limit $2`,
    [userId, limit],
  );

  return rows
    .filter((row) => evaluatePolicyChangePublication(row).ready)
    .map((row) => ({
      ...toPublicPolicyChangeListItem(mapJoinedPolicyChange(row)),
      alert_id: row.alert_id,
      alert_status: row.alert_status,
      alert_created_at: row.alert_created_at,
      read_at: row.read_at,
    })) satisfies DashboardPolicyAlert[];
}
