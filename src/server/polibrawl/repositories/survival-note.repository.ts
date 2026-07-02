import "server-only";

import { createCrudRepository } from "@/server/polibrawl/repositories/base.repository";
import type {
  CreateSurvivalNoteDto,
  SurvivalNote,
  SurvivalNoteListFilters,
  UpdateSurvivalNoteDto,
} from "@/types/polibrawl";

const survivalNoteColumns = [
  "red_flag_id",
  "note_title",
  "note_body",
  "priority",
  "status",
  "published_at",
  "archived_at",
] as const;

export const survivalNoteRepository = createCrudRepository<
  SurvivalNote,
  CreateSurvivalNoteDto,
  UpdateSurvivalNoteDto,
  SurvivalNoteListFilters
>({
  tableName: "survival_notes",
  insertableColumns: survivalNoteColumns,
  updatableColumns: survivalNoteColumns,
  filterableColumns: ["id", "red_flag_id", "status", "priority"],
  defaultOrderBy: "updated_at desc",
  archive: {
    archivedAtColumn: "archived_at",
    statusColumn: "status",
    archivedStatusValue: "archived",
  },
});

export const listSurvivalNotes = survivalNoteRepository.list;
export const findSurvivalNoteById = survivalNoteRepository.findById;
export const findSurvivalNote = survivalNoteRepository.findOne;
export const createSurvivalNote = survivalNoteRepository.insert;
export const updateSurvivalNote = survivalNoteRepository.update;
export const archiveSurvivalNote = survivalNoteRepository.archive;
