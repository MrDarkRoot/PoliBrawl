// Sprint 4 types have been consolidated into src/types/polibrawl.ts.
// This file is kept as a re-export shim to avoid breaking any existing imports.
export type {
  KeywordMatchStatus,
  KeywordMatch,
  ScanSnapshotResult,
} from "@/types/polibrawl";

// ScanSnapshotInput is defined in the Zod schema:
// src/features/candidates/schemas/scanner.schema.ts
