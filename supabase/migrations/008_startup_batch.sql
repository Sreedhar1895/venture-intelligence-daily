-- Batch and demo day for accelerator-backed startups
ALTER TABLE startups ADD COLUMN IF NOT EXISTS batch TEXT;
CREATE INDEX IF NOT EXISTS idx_startups_batch ON startups(batch);
