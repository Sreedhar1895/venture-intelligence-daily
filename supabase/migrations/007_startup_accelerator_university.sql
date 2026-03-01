-- Accelerator and university filters for Startups to Watch
ALTER TABLE startups ADD COLUMN IF NOT EXISTS accelerator TEXT;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS university TEXT;
CREATE INDEX IF NOT EXISTS idx_startups_accelerator ON startups(accelerator);
CREATE INDEX IF NOT EXISTS idx_startups_university ON startups(university);
