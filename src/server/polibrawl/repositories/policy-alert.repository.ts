import "server-only";

import { queryMany, queryOne } from "@/server/polibrawl/db";
import type { PolicyAlert, PolicyAlertStatus } from "@/types/polibrawl";

export async function listPolicyAlertsByUser(
  userId: string,
  options: { status?: PolicyAlertStatus; limit?: number } = {},
) {
  const clauses = ["user_id = $1"];
  const values: unknown[] = [userId];

  if (options.status) {
    values.push(options.status);
    clauses.push(`status = $${values.length}`);
  }

  const limitClause =
    typeof options.limit === "number" ? ` limit $${values.length + 1}` : "";

  if (typeof options.limit === "number") {
    values.push(options.limit);
  }

  return queryMany<PolicyAlert>(
    `select *
     from policy_alerts
     where ${clauses.join(" and ")}
     order by created_at desc${limitClause}`,
    values,
  );
}

export async function markPolicyAlertRead(userId: string, alertId: string) {
  return queryOne<PolicyAlert>(
    `update policy_alerts
     set status = 'read',
         read_at = coalesce(read_at, now())
     where id = $1
       and user_id = $2
     returning *`,
    [alertId, userId],
  );
}

export async function markAllPolicyAlertsRead(userId: string) {
  return queryMany<PolicyAlert>(
    `update policy_alerts
     set status = 'read',
         read_at = coalesce(read_at, now())
     where user_id = $1
       and status = 'unread'
     returning *`,
    [userId],
  );
}
