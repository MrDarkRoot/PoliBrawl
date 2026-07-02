import { createCrudRepository } from "./base.repository";
import type { PlatformSurvivalPage, CreatePlatformSurvivalPageDto } from "@/types/polibrawl";
import { queryMany } from "@/server/polibrawl/db";

export const platformSurvivalPageRepository = createCrudRepository<
  PlatformSurvivalPage,
  CreatePlatformSurvivalPageDto,
  Partial<CreatePlatformSurvivalPageDto>,
  Record<string, string | number | boolean | null | undefined>
>({
  tableName: "platform_survival_pages",
  insertableColumns: [
    "platform_id",
    "slug",
    "title",
    "summary",
    "main_level",
    "status",
    "editorial_intro",
    "survival_summary",
    "disclaimer_note",
    "last_reviewed_at",
    "ready_for_publish"
  ],
  updatableColumns: [
    "slug",
    "title",
    "summary",
    "main_level",
    "status",
    "editorial_intro",
    "survival_summary",
    "disclaimer_note",
    "last_reviewed_at",
    "ready_for_publish"
  ],
  filterableColumns: ["id", "platform_id", "status", "slug"],
  archive: {
    archivedAtColumn: "archived_at",
    statusColumn: "status",
    archivedStatusValue: "archived",
  }
});

export const {
  findById: findPlatformSurvivalPageById,
  insert: createPlatformSurvivalPage,
  update: updatePlatformSurvivalPage,
  archive: archivePlatformSurvivalPage
} = platformSurvivalPageRepository;

export async function findPlatformSurvivalPageByPlatformId(platformId: string): Promise<PlatformSurvivalPage | null> {
  const results = await queryMany<PlatformSurvivalPage>(
    `SELECT * FROM platform_survival_pages WHERE platform_id = $1 AND archived_at IS NULL LIMIT 1`,
    [platformId]
  );
  return results[0] || null;
}

export async function listPlatformSurvivalPages(): Promise<(PlatformSurvivalPage & { platform_name: string })[]> {
  return await queryMany<PlatformSurvivalPage & { platform_name: string }>(
    `SELECT psp.*, p.name as platform_name 
     FROM platform_survival_pages psp
     JOIN platforms p ON psp.platform_id = p.id
     WHERE psp.archived_at IS NULL
     ORDER BY psp.updated_at DESC`
  );
}
