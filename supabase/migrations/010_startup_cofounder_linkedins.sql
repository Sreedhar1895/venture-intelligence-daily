-- Cofounder LinkedIn URLs for startups (optional, for display across startup reference tabs)
ALTER TABLE startups ADD COLUMN IF NOT EXISTS cofounder_linkedins JSONB DEFAULT '[]';
COMMENT ON COLUMN startups.cofounder_linkedins IS 'Array of { "name": string, "url": string } for founder/cofounder LinkedIn profiles';
