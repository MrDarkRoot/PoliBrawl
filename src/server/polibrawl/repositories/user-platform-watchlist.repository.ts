import "server-only";

import { queryMany, queryOne } from "@/server/polibrawl/db";
import type { UserPlatformWatchlist } from "@/types/polibrawl";

export async function listUserPlatformWatchlist(userId: string) {
  return queryMany<UserPlatformWatchlist>(
    `select *
     from user_platform_watchlist
     where user_id = $1
     order by created_at desc`,
    [userId],
  );
}

export async function findUserPlatformWatch(userId: string, platformId: string) {
  return queryOne<UserPlatformWatchlist>(
    `select *
     from user_platform_watchlist
     where user_id = $1
       and platform_id = $2
     limit 1`,
    [userId, platformId],
  );
}

export async function createUserPlatformWatch(userId: string, platformId: string) {
  const created = await queryOne<UserPlatformWatchlist>(
    `insert into user_platform_watchlist (user_id, platform_id)
     values ($1, $2)
     on conflict (user_id, platform_id) do nothing
     returning *`,
    [userId, platformId],
  );

  if (created) {
    return created;
  }

  return findUserPlatformWatch(userId, platformId);
}

export async function deleteUserPlatformWatch(userId: string, platformId: string) {
  return queryOne<UserPlatformWatchlist>(
    `delete from user_platform_watchlist
     where user_id = $1
       and platform_id = $2
     returning *`,
    [userId, platformId],
  );
}
