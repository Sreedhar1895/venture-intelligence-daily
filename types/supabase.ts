export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: { id: string; email: string; created_at: string };
        Insert: { id?: string; email: string; created_at?: string };
        Update: { id?: string; email?: string; created_at?: string };
      };
      articles: {
        Row: {
          id: string;
          title: string;
          source: string;
          url: string;
          published_at: string | null;
          raw_content: string | null;
          sector_tags: string[];
          event_type: string | null;
          stage: string | null;
          summary: string | null;
          strategic_note: string | null;
          relevance_score: number;
          related_tracked_startup: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          source: string;
          url: string;
          published_at?: string | null;
          raw_content?: string | null;
          sector_tags?: string[];
          event_type?: string | null;
          stage?: string | null;
          summary?: string | null;
          strategic_note?: string | null;
          relevance_score?: number;
          related_tracked_startup?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["articles"]["Insert"]>;
      };
      research: {
        Row: {
          id: string;
          title: string;
          source: string;
          url: string;
          abstract: string | null;
          sector_tags: string[];
          published_at: string | null;
          summary: string | null;
          relevance_score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          source: string;
          url: string;
          abstract?: string | null;
          sector_tags?: string[];
          published_at?: string | null;
          summary?: string | null;
          relevance_score?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["research"]["Insert"]>;
      };
      startups: {
        Row: {
          id: string;
          name: string;
          website: string | null;
          sector_tags: string[];
          founding_team: string | null;
          why_interesting: string | null;
          featured: boolean;
          links: { label: string; url: string }[];
          cofounder_linkedins: { name: string; url: string }[] | null;
          relevance_score: number;
          overall_score: number;
          moat_note: string | null;
          signals: { signed_customers?: boolean; team_grew?: boolean; raised_funding?: boolean };
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          website?: string | null;
          sector_tags?: string[];
          founding_team?: string | null;
          why_interesting?: string | null;
          featured?: boolean;
          links?: { label: string; url: string }[];
          cofounder_linkedins?: { name: string; url: string }[] | null;
          relevance_score?: number;
          overall_score?: number;
          moat_note?: string | null;
          signals?: { signed_customers?: boolean; team_grew?: boolean; raised_funding?: boolean };
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["startups"]["Insert"]>;
      };
      pinned_items: {
        Row: {
          id: string;
          user_id: string;
          item_type: string;
          item_id: string;
          item_title: string | null;
          item_url: string | null;
          item_meta: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_type: string;
          item_id: string;
          item_title?: string | null;
          item_url?: string | null;
          item_meta?: Record<string, unknown>;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pinned_items"]["Insert"]>;
      };
      starred_startups: {
        Row: { id: string; user_id: string; startup_id: string; created_at: string };
        Insert: { id?: string; user_id: string; startup_id: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["starred_startups"]["Insert"]>;
      };
      startup_updates: {
        Row: {
          id: string;
          startup_id: string;
          update_type: string;
          title: string;
          summary: string | null;
          source: string | null;
          url: string | null;
          published_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          startup_id: string;
          update_type: string;
          title: string;
          summary?: string | null;
          source?: string | null;
          url?: string | null;
          published_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["startup_updates"]["Insert"]>;
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          sector_filters: string[];
          email_digest_enabled: boolean;
          digest_city_filter: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          sector_filters?: string[];
          email_digest_enabled?: boolean;
          digest_city_filter?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["user_preferences"]["Insert"]>;
      };
    };
  };
}
