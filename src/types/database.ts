export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          username: string | null;
          role: "viewer" | "editor" | "admin" | "owner";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          username?: string | null;
          role?: "viewer" | "editor" | "admin" | "owner";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      platforms: {
        Row: {
          id: string;
          name: string;
          slug: string;
          website_url: string;
          category: "payment" | "creator_freelance" | "saas_vendor";
          country: string | null;
          status: "draft" | "active" | "archived" | "needs_review";
          summary: string | null;
          internal_notes: string | null;
          last_reviewed_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          website_url: string;
          category: "payment" | "creator_freelance" | "saas_vendor";
          country?: string | null;
          status?: "draft" | "active" | "archived" | "needs_review";
          summary?: string | null;
          internal_notes?: string | null;
          last_reviewed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["platforms"]["Insert"]>;
      };
      discovery_runs: {
        Row: {
          id: string;
          platform_id: string;
          website_url: string;
          status: "running" | "completed" | "failed" | "partial";
          started_at: string;
          completed_at: string | null;
          error_message: string | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          platform_id: string;
          website_url: string;
          status?: "running" | "completed" | "failed" | "partial";
          started_at?: string;
          completed_at?: string | null;
          error_message?: string | null;
          metadata?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["discovery_runs"]["Insert"]>;
      };
      source_candidates: {
        Row: {
          id: string;
          discovery_run_id: string | null;
          platform_id: string;
          url: string;
          canonical_url: string | null;
          title: string | null;
          suggested_document_type: string | null;
          suggested_tier: string | null;
          confidence: number | null;
          detection_reason: string | null;
          filter_score: number;
          filter_decision: string;
          filter_reasons: Json;
          content_document_type: string | null;
          content_source_tier: string | null;
          content_use_for_scoring: boolean | null;
          content_monitor_enabled: boolean | null;
          content_confidence: number | null;
          content_classification_reasons: Json;
          content_preview_markdown: string | null;
          content_preview_plain_text: string | null;
          content_preview_final_url: string | null;
          content_preview_fetched_at: string | null;
          status: "pending" | "approved" | "rejected" | "needs_manual_review";
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          discovery_run_id?: string | null;
          platform_id: string;
          url: string;
          canonical_url?: string | null;
          title?: string | null;
          suggested_document_type?: string | null;
          suggested_tier?: string | null;
          confidence?: number | null;
          detection_reason?: string | null;
          filter_score?: number;
          filter_decision?: string;
          filter_reasons?: Json;
          content_document_type?: string | null;
          content_source_tier?: string | null;
          content_use_for_scoring?: boolean | null;
          content_monitor_enabled?: boolean | null;
          content_confidence?: number | null;
          content_classification_reasons?: Json;
          content_preview_markdown?: string | null;
          content_preview_plain_text?: string | null;
          content_preview_final_url?: string | null;
          content_preview_fetched_at?: string | null;
          status?: "pending" | "approved" | "rejected" | "needs_manual_review";
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["source_candidates"]["Insert"]>;
      };
      policy_sources: {
        Row: {
          id: string;
          platform_id: string;
          title: string | null;
          url: string;
          final_url: string | null;
          document_type: string;
          source_tier: string;
          use_for_scoring: boolean;
          monitor_enabled: boolean;
          status: string;
          current_hash: string | null;
          last_fetched_at: string | null;
          last_reviewed_at: string | null;
          content_document_type: string | null;
          content_source_tier: string | null;
          content_use_for_scoring: boolean | null;
          content_monitor_enabled: boolean | null;
          content_confidence: number | null;
          content_classification_reasons: Json;
          content_classified_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          platform_id: string;
          title?: string | null;
          url: string;
          final_url?: string | null;
          document_type: string;
          source_tier: string;
          use_for_scoring?: boolean;
          monitor_enabled?: boolean;
          status?: string;
          current_hash?: string | null;
          last_fetched_at?: string | null;
          last_reviewed_at?: string | null;
          content_document_type?: string | null;
          content_source_tier?: string | null;
          content_use_for_scoring?: boolean | null;
          content_monitor_enabled?: boolean | null;
          content_confidence?: number | null;
          content_classification_reasons?: Json;
          content_classified_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["policy_sources"]["Insert"]>;
      };
      fetch_logs: {
        Row: {
          id: string;
          policy_source_id: string;
          requested_url: string;
          final_url: string | null;
          http_status: number | null;
          content_type: string | null;
          response_size: number | null;
          success: boolean;
          error_message: string | null;
          fetched_at: string;
          metadata: Json;
        };
        Insert: {
          id?: string;
          policy_source_id: string;
          requested_url: string;
          final_url?: string | null;
          http_status?: number | null;
          content_type?: string | null;
          response_size?: number | null;
          success?: boolean;
          error_message?: string | null;
          fetched_at?: string;
          metadata?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["fetch_logs"]["Insert"]>;
      };
      document_versions: {
        Row: {
          id: string;
          policy_source_id: string;
          version_number: number;
          text_hash: string;
          raw_html_storage_key: string | null;
          pdf_storage_key: string | null;
          markdown_text: string | null;
          plain_text: string | null;
          extraction_confidence: number | null;
          extraction_method: string | null;
          fetched_at: string;
          effective_date: string | null;
          review_status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          policy_source_id: string;
          version_number: number;
          text_hash: string;
          raw_html_storage_key?: string | null;
          pdf_storage_key?: string | null;
          markdown_text?: string | null;
          plain_text?: string | null;
          extraction_confidence?: number | null;
          extraction_method?: string | null;
          fetched_at?: string;
          effective_date?: string | null;
          review_status?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["document_versions"]["Insert"]>;
      };
      policy_changes: {
        Row: {
          id: string;
          platform_id: string;
          policy_source_id: string;
          old_version_id: string | null;
          new_version_id: string | null;
          old_hash: string | null;
          new_hash: string | null;
          detected_at: string;
          status: "needs_review" | "reviewed" | "ignored" | "published";
          importance: "minor" | "important" | "critical" | "unknown";
          summary: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          platform_id: string;
          policy_source_id: string;
          old_version_id?: string | null;
          new_version_id?: string | null;
          old_hash?: string | null;
          new_hash?: string | null;
          detected_at?: string;
          status?: "needs_review" | "reviewed" | "ignored" | "published";
          importance?: "minor" | "important" | "critical" | "unknown";
          summary?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["policy_changes"]["Insert"]>;
      };
      sections: {
        Row: {
          id: string;
          document_version_id: string;
          parent_section_id: string | null;
          heading: string | null;
          section_order: number;
          section_text: string | null;
          anchor: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_version_id: string;
          parent_section_id?: string | null;
          heading?: string | null;
          section_order?: number;
          section_text?: string | null;
          anchor?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sections"]["Insert"]>;
      };
      clauses: {
        Row: {
          id: string;
          section_id: string | null;
          document_version_id: string;
          clause_order: number;
          clause_text: string;
          clause_hash: string | null;
          word_count: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          section_id?: string | null;
          document_version_id: string;
          clause_order?: number;
          clause_text: string;
          clause_hash?: string | null;
          word_count?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clauses"]["Insert"]>;
      };
      signal_rules: {
        Row: {
          id: string;
          rule_name: string;
          category: string;
          signal_name: string;
          keywords: Json;
          regex_patterns: Json;
          suggested_level: "low" | "medium" | "high" | "very_high" | "unknown";
          confidence_weight: number;
          false_positive_notes: string | null;
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          rule_name: string;
          category: string;
          signal_name: string;
          keywords?: Json;
          regex_patterns?: Json;
          suggested_level?: "low" | "medium" | "high" | "very_high" | "unknown";
          confidence_weight?: number;
          false_positive_notes?: string | null;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["signal_rules"]["Insert"]>;
      };
      signal_candidates: {
        Row: {
          id: string;
          clause_id: string;
          platform_id: string;
          policy_source_id: string;
          rule_id: string | null;
          suggested_signal: string;
          suggested_category: string;
          suggested_level: "low" | "medium" | "high" | "very_high" | "unknown";
          confidence: number | null;
          matched_terms: Json;
          detection_method: "rule" | "ai" | "manual" | "hybrid";
          status: "pending" | "approved" | "rejected" | "needs_deeper_review";
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          clause_id: string;
          platform_id: string;
          policy_source_id: string;
          rule_id?: string | null;
          suggested_signal: string;
          suggested_category: string;
          suggested_level?: "low" | "medium" | "high" | "very_high" | "unknown";
          confidence?: number | null;
          matched_terms?: Json;
          detection_method?: "rule" | "ai" | "manual" | "hybrid";
          status?: "pending" | "approved" | "rejected" | "needs_deeper_review";
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["signal_candidates"]["Insert"]>;
      };
      signals: {
        Row: {
          id: string;
          platform_id: string;
          category: string;
          name: string;
          level: "low" | "medium" | "high" | "very_high" | "unknown";
          confidence: "low" | "medium" | "high";
          explanation: string | null;
          internal_reason: string | null;
          status: "draft" | "approved" | "published" | "archived" | "needs_review";
          approved_by: string | null;
          approved_at: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          platform_id: string;
          category: string;
          name: string;
          level: "low" | "medium" | "high" | "very_high" | "unknown";
          confidence?: "low" | "medium" | "high";
          explanation?: string | null;
          internal_reason?: string | null;
          status?: "draft" | "approved" | "published" | "archived" | "needs_review";
          approved_by?: string | null;
          approved_at?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["signals"]["Insert"]>;
      };
      evidence_items: {
        Row: {
          id: string;
          signal_id: string;
          clause_id: string | null;
          policy_source_id: string;
          document_version_id: string | null;
          clause_excerpt: string;
          source_url: string;
          document_title: string | null;
          review_date: string;
          explanation: string;
          why_it_matters: string | null;
          visibility: "public" | "internal" | "hidden";
          status: "draft" | "approved" | "published" | "archived";
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          signal_id: string;
          clause_id?: string | null;
          policy_source_id: string;
          document_version_id?: string | null;
          clause_excerpt: string;
          source_url: string;
          document_title?: string | null;
          review_date?: string;
          explanation: string;
          why_it_matters?: string | null;
          visibility?: "public" | "internal" | "hidden";
          status?: "draft" | "approved" | "published" | "archived";
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["evidence_items"]["Insert"]>;
      };
      editorial_tasks: {
        Row: {
          id: string;
          task_type: string;
          platform_id: string | null;
          related_entity_type: string | null;
          related_entity_id: string | null;
          title: string;
          status: string;
          priority: string;
          assigned_to: string | null;
          created_by: string | null;
          reviewed_by: string | null;
          due_at: string | null;
          completed_at: string | null;
          internal_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          task_type: string;
          platform_id?: string | null;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          title: string;
          status?: string;
          priority?: string;
          assigned_to?: string | null;
          created_by?: string | null;
          reviewed_by?: string | null;
          due_at?: string | null;
          completed_at?: string | null;
          internal_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["editorial_tasks"]["Insert"]>;
      };
      editorial_decision_logs: {
        Row: {
          id: string;
          platform_id: string | null;
          entity_type: string;
          entity_id: string;
          action: string;
          previous_value: Json | null;
          new_value: Json | null;
          reason: string | null;
          decided_by: string | null;
          decided_at: string;
        };
        Insert: {
          id?: string;
          platform_id?: string | null;
          entity_type: string;
          entity_id: string;
          action: string;
          previous_value?: Json | null;
          new_value?: Json | null;
          reason?: string | null;
          decided_by?: string | null;
          decided_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["editorial_decision_logs"]["Insert"]>;
      };
      platform_profiles: {
        Row: {
          id: string;
          platform_id: string;
          public_summary: string | null;
          user_implications: string | null;
          alternatives_summary: string | null;
          profile_status: "draft" | "published" | "unpublished" | "needs_review";
          last_generated_at: string | null;
          last_published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          platform_id: string;
          public_summary?: string | null;
          user_implications?: string | null;
          alternatives_summary?: string | null;
          profile_status?: "draft" | "published" | "unpublished" | "needs_review";
          last_generated_at?: string | null;
          last_published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["platform_profiles"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
