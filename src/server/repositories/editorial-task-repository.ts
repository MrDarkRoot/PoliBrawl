import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function createEditorialTask(input: {
  taskType: string;
  platformId?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  title: string;
  createdBy?: string | null;
  priority?: "low" | "normal" | "high" | "urgent";
  internalNotes?: string | null;
}) {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("editorial_tasks")
    .insert({
      task_type: input.taskType,
      platform_id: input.platformId ?? null,
      related_entity_type: input.relatedEntityType ?? null,
      related_entity_id: input.relatedEntityId ?? null,
      title: input.title,
      created_by: input.createdBy ?? null,
      priority: input.priority ?? "normal",
      internal_notes: input.internalNotes ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
