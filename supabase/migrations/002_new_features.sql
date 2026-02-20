-- Stage filter for articles (early stage vs growth vs public/PE)
ALTER TABLE articles ADD COLUMN IF NOT EXISTS stage TEXT;
CREATE INDEX IF NOT EXISTS idx_articles_stage ON articles(stage);

-- Research table for cutting-edge research by sector
CREATE TABLE IF NOT EXISTS research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  abstract TEXT,
  sector_tags TEXT[] DEFAULT '{}',
  published_at TIMESTAMPTZ,
  summary TEXT,
  relevance_score INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_research_sector ON research(sector_tags);
CREATE INDEX IF NOT EXISTS idx_research_relevance ON research(relevance_score DESC);

-- Research and Startups to Watch are populated only from ingested data (no seed data).

-- Extend startups for "Startups to Watch" (featured, founding team, why interesting, links)
ALTER TABLE startups ADD COLUMN IF NOT EXISTS founding_team TEXT;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS why_interesting TEXT;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]';
CREATE INDEX IF NOT EXISTS idx_startups_featured ON startups(featured) WHERE featured = true;

-- Pinned items (user pins articles, events, research, startups)
CREATE TABLE IF NOT EXISTS pinned_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_title TEXT,
  item_url TEXT,
  item_meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);
CREATE INDEX IF NOT EXISTS idx_pinned_user ON pinned_items(user_id);

-- Startups to Watch are populated from ingested articles (Claude extracts startups from news).
