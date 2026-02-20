-- Rubric-based overall score for Startups to Watch (from ingested articles only)
-- Vertical (1) + New customers/partnerships (5) + Accelerator/funding (4) + Key hires (2) + Research (3)
ALTER TABLE startups ADD COLUMN IF NOT EXISTS overall_score INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_startups_overall_score ON startups(overall_score DESC) WHERE overall_score > 0;

COMMENT ON COLUMN startups.overall_score IS 'Sum of rubric points from articles; only show when > 0';
