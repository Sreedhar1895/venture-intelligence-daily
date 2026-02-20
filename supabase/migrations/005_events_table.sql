-- Events table for demo days, conferences, founder/investor meetups
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  city TEXT,
  date DATE NOT NULL,
  url TEXT,
  registration_url TEXT,
  source TEXT NOT NULL,
  event_type TEXT,
  sector_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(url)
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(date DESC);
CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);
