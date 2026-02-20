-- Remove test/seed data: only real ingested data
DELETE FROM startups WHERE name IN ('Example AI', 'FinOS');
DELETE FROM research WHERE url = 'https://arxiv.org/abs/2401.00000';

-- Startup scoring and signals (from ingested articles)
ALTER TABLE startups ADD COLUMN IF NOT EXISTS relevance_score INT DEFAULT 0;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS moat_note TEXT;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS signals JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_startups_relevance ON startups(relevance_score DESC) WHERE featured = true;

COMMENT ON COLUMN startups.relevance_score IS '1-10 score for Vertical SaaS, AI-native, Fintech, Robotics relevance';
COMMENT ON COLUMN startups.moat_note IS 'Short note on interesting moat if mentioned in article';
COMMENT ON COLUMN startups.signals IS 'JSON: signed_customers, team_grew, raised_funding (booleans from article)';
