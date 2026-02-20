CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  published_at TIMESTAMPTZ,
  raw_content TEXT,
  sector_tags TEXT[] DEFAULT '{}',
  event_type TEXT,
  summary TEXT,
  strategic_note TEXT,
  relevance_score INT DEFAULT 0,
  related_tracked_startup TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_articles_relevance ON articles(relevance_score DESC);
CREATE INDEX idx_articles_published ON articles(published_at DESC);

CREATE TABLE startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website TEXT,
  sector_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE starred_startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, startup_id)
);

CREATE INDEX idx_starred_user ON starred_startups(user_id);

CREATE TABLE startup_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  update_type TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  source TEXT,
  url TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_startup_updates_startup ON startup_updates(startup_id);

CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  sector_filters TEXT[] DEFAULT '{}',
  email_digest_enabled BOOLEAN DEFAULT true,
  digest_city_filter TEXT
);

INSERT INTO users (id, email) VALUES
  ('00000000-0000-0000-0000-000000000001', 'demo@venture-intel.local')
ON CONFLICT (email) DO NOTHING;
