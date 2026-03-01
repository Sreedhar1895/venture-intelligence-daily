-- User subscribes to email updates for a specific startup
CREATE TABLE IF NOT EXISTS startup_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, startup_id)
);
CREATE INDEX IF NOT EXISTS idx_startup_notifications_user ON startup_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_startup_notifications_startup ON startup_notifications(startup_id);
