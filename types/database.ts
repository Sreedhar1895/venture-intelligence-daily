export type SectorTag = "AI-native" | "Vertical SaaS" | "Fintech" | "Robotics" | "Other";

export type EventType =
  | "Fundraise"
  | "Major Hiring"
  | "Product Launch"
  | "Accelerator"
  | "Research Breakthrough"
  | "University Lab Initiative"
  | "Policy / Regulation"
  | "Acquisition"
  | "Event"
  | "General News";

export interface Article {
  id: string;
  title: string;
  source: string;
  url: string;
  published_at: string | null;
  raw_content: string | null;
  sector_tags: SectorTag[];
  event_type: EventType | null;
  summary: string | null;
  strategic_note: string | null;
  relevance_score: number;
  related_tracked_startup: string | null;
  created_at: string;
}

export interface Startup {
  id: string;
  name: string;
  website: string | null;
  sector_tags: SectorTag[];
  created_at: string;
}

export interface StarredStartup {
  id: string;
  user_id: string;
  startup_id: string;
  created_at: string;
  startups?: Startup;
}

export interface StartupUpdate {
  id: string;
  startup_id: string;
  update_type: string;
  title: string;
  summary: string | null;
  source: string | null;
  url: string | null;
  published_at: string | null;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  sector_filters: string[];
  email_digest_enabled: boolean;
  digest_city_filter: string | null;
}

export interface ClaudeClassification {
  sector_tags: SectorTag[];
  event_type: EventType;
  summary: string;
  strategic_note: string;
  relevance_score: number;
}
