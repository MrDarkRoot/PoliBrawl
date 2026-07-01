import type { Database } from "@/types/database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Platform = Database["public"]["Tables"]["platforms"]["Row"];
export type DiscoveryRun = Database["public"]["Tables"]["discovery_runs"]["Row"];
export type SourceCandidate =
  Database["public"]["Tables"]["source_candidates"]["Row"];
export type PolicySource = Database["public"]["Tables"]["policy_sources"]["Row"];
export type FetchLog = Database["public"]["Tables"]["fetch_logs"]["Row"];
export type DocumentVersion =
  Database["public"]["Tables"]["document_versions"]["Row"];
export type Section = Database["public"]["Tables"]["sections"]["Row"];
export type Clause = Database["public"]["Tables"]["clauses"]["Row"];
export type SignalRule = Database["public"]["Tables"]["signal_rules"]["Row"];
export type SignalCandidate =
  Database["public"]["Tables"]["signal_candidates"]["Row"];
export type Signal = Database["public"]["Tables"]["signals"]["Row"];
export type EvidenceItem = Database["public"]["Tables"]["evidence_items"]["Row"];
export type EditorialTask =
  Database["public"]["Tables"]["editorial_tasks"]["Row"];

export type DashboardMetrics = {
  platforms: number;
  pendingCandidates: number;
  sources: number;
  versions: number;
  clauses: number;
  signalCandidates: number;
  approvedSignals: number;
  evidenceItems: number;
};

export type AdminRole = Profile["role"];
