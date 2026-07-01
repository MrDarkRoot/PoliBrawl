import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

export async function logDecision(input: {
  platformId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  previousValue?: Json | null;
  newValue?: Json | null;
  reason?: string | null;
  decidedBy?: string | null;
}) {
  const supabase = createAdminSupabaseClient();

  const { error } = await supabase.from("editorial_decision_logs").insert({
    platform_id: input.platformId ?? null,
    entity_type: input.entityType,
    entity_id: input.entityId,
    action: input.action,
    previous_value: input.previousValue ?? null,
    new_value: input.newValue ?? null,
    reason: input.reason ?? null,
    decided_by: input.decidedBy ?? null,
  });

  if (error) {
    throw error;
  }
}
