"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAccess } from "@/lib/auth";
import { addEvidenceSchema, addSurvivalNoteSchema, addBackupOptionSchema, addChecklistItemSchema, deleteEvidenceSchema } from "../schemas/workspace.schema";
import { createEvidence, archiveEvidence } from "@/server/polibrawl/repositories/evidence.repository";
import { createSurvivalNote } from "@/server/polibrawl/repositories/survival-note.repository";
import { createBackupOption } from "@/server/polibrawl/repositories/backup-option.repository";
import { createChecklistItem } from "@/server/polibrawl/repositories/checklist-item.repository";
import { createChecklist } from "@/server/polibrawl/repositories/checklist.repository";
import { queryOne } from "@/server/polibrawl/db";
import type { Checklist, EvidenceItem } from "@/types/polibrawl";

export async function addEvidenceAction(prevState: unknown, formData: FormData): Promise<{ success: boolean; error: string | null; }> {
  await requireAdminAccess();
  const parsed = addEvidenceSchema.safeParse({
    redFlagId: formData.get("redFlagId"),
    title: formData.get("title"),
    excerpt: formData.get("excerpt"),
    confidence: formData.get("confidence"),
    sourceId: formData.get("sourceId"),
  });
  if (!parsed.success) return { success: false, error: "Invalid data" };
  
  await createEvidence({
    red_flag_id: parsed.data.redFlagId,
    title: parsed.data.title,
    excerpt: parsed.data.excerpt,
    confidence: parsed.data.confidence,
    source_id: parsed.data.sourceId,
    source_title: parsed.data.title,
    source_url: null,
    notes: null,
    reviewed_at: null,
    status: "draft",
    sort_order: 0,
    display_order: 0,
  });
  
  revalidatePath(`/admin/red-flags/${parsed.data.redFlagId}`);
  return { success: true, error: null };
}

export async function addSurvivalNoteAction(prevState: unknown, formData: FormData): Promise<{ success: boolean; error: string | null; }> {
  await requireAdminAccess();
  const parsed = addSurvivalNoteSchema.safeParse({
    redFlagId: formData.get("redFlagId"),
    title: formData.get("title"),
    body: formData.get("body"),
    priority: formData.get("priority"),
  });
  if (!parsed.success) return { success: false, error: "Invalid data" };
  
  await createSurvivalNote({
    red_flag_id: parsed.data.redFlagId,
    title: parsed.data.title,
    body: parsed.data.body,
    note_title: parsed.data.title,
    note_body: parsed.data.body,
    priority: parsed.data.priority,
    status: "draft",
    display_order: 0,
  });
  
  revalidatePath(`/admin/red-flags/${parsed.data.redFlagId}`);
  return { success: true, error: null };
}

export async function addBackupOptionAction(prevState: unknown, formData: FormData): Promise<{ success: boolean; error: string | null; }> {
  await requireAdminAccess();
  const parsed = addBackupOptionSchema.safeParse({
    redFlagId: formData.get("redFlagId"),
    name: formData.get("name"),
    summary: formData.get("summary"),
    tradeoffs: formData.get("tradeoffs"),
    difficulty: formData.get("difficulty"),
    cost_level: formData.get("cost_level"),
    optionType: formData.get("optionType"),
  });
  if (!parsed.success) return { success: false, error: "Invalid data" };
  
  await createBackupOption({
    red_flag_id: parsed.data.redFlagId,
    platform_id: null,
    name: parsed.data.name,
    label: parsed.data.name,
    summary: parsed.data.summary,
    tradeoffs: parsed.data.tradeoffs,
    difficulty: parsed.data.difficulty || null,
    cost_level: parsed.data.cost_level || null,
    option_type: parsed.data.optionType as import("@/types/polibrawl").BackupOptionType,
    link_url: null,
    status: "draft",
  });
  
  revalidatePath(`/admin/red-flags/${parsed.data.redFlagId}`);
  return { success: true, error: null };
}

export async function addChecklistItemAction(prevState: unknown, formData: FormData): Promise<{ success: boolean; error: string | null; }> {
  await requireAdminAccess();
  const redFlagId = formData.get("redFlagId") as string;
  let checklistId = formData.get("checklistId") as string;

  if (!checklistId) {
    let checklist = await queryOne<Checklist>(`SELECT * FROM checklists WHERE red_flag_id = $1`, [redFlagId]);
    if (!checklist) {
      checklist = await createChecklist({
        red_flag_id: redFlagId,
        platform_id: null,
        title: "Default Checklist",
        intro: null,
        status: "draft",
      }) as Checklist;
    }
    checklistId = checklist.id;
  } else {
    // Verify checklist belongs to redFlagId
    const checklist = await queryOne<Checklist>(`SELECT * FROM checklists WHERE id = $1`, [checklistId]);
    if (!checklist || checklist.red_flag_id !== redFlagId) {
      return { success: false, error: "Invalid checklist association" };
    }
  }

  const parsed = addChecklistItemSchema.safeParse({
    checklistId,
    text: formData.get("text"),
    required: formData.get("required") === "on",
  });
  if (!parsed.success) return { success: false, error: "Invalid data" };
  
  await createChecklistItem({
    checklist_id: parsed.data.checklistId,
    text: parsed.data.text,
    label: parsed.data.text,
    details: null,
    required: parsed.data.required,
    status: "draft",
    sort_order: 0,
    display_order: 0,
  });
  
  revalidatePath(`/admin/red-flags/${redFlagId}`);
  return { success: true, error: null };
}

export async function deleteEvidenceAction(id: string, redFlagId: string) {
  await requireAdminAccess();
  
  const parsed = deleteEvidenceSchema.safeParse({ id, redFlagId });
  if (!parsed.success) {
    throw new Error("Invalid data provided for deletion");
  }

  const evidence = await queryOne<EvidenceItem>(`SELECT * FROM evidence WHERE id = $1`, [parsed.data.id]);
  if (!evidence) {
    throw new Error("Evidence not found");
  }

  if (evidence.red_flag_id !== parsed.data.redFlagId) {
    throw new Error("Evidence does not belong to the specified red flag");
  }

  await archiveEvidence(parsed.data.id);
  
  revalidatePath(`/admin/red-flags/${parsed.data.redFlagId}`);
}
