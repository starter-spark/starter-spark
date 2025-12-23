-- Separate table for teapot easter egg statistics
-- Keeps API call tracking out of the public site_stats table
CREATE TABLE IF NOT EXISTS teapot_stats (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE teapot_stats ENABLE ROW LEVEL SECURITY;

-- Anyone can read teapot stats (it's an easter egg)
CREATE POLICY "Anyone can read teapot stats"
  ON teapot_stats FOR SELECT
  USING (true);

-- Only authenticated users can increment (via RPC)
CREATE POLICY "Service role can update teapot stats"
  ON teapot_stats FOR UPDATE
  USING (true);

-- Initialize the API calls counter
INSERT INTO teapot_stats (key, value) VALUES ('api_calls', 0);

-- Function to increment teapot API calls and return the new count
CREATE OR REPLACE FUNCTION increment_teapot_api_calls()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE teapot_stats
  SET value = value + 1, updated_at = now()
  WHERE key = 'api_calls'
  RETURNING value INTO new_count;

  RETURN COALESCE(new_count, 0);
END;
$$;

-- Grant execute to authenticated and anon (rate limited in app)
GRANT EXECUTE ON FUNCTION increment_teapot_api_calls() TO authenticated, anon;
