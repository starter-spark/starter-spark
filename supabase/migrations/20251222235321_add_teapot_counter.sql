-- Add teapot view counter to existing site_stats table

-- Initialize the teapot counter
INSERT INTO site_stats (key, value, label, suffix, description, is_auto_calculated, sort_order)
VALUES ('teapot_views', 0, 'Teapot Views', '', 'Number of times the 418 teapot easter egg has been viewed by authenticated users', false, 100)
ON CONFLICT (key) DO NOTHING;

-- Function to increment a stat counter atomically
-- Only authenticated users can increment (prevents anonymous spam)
CREATE OR REPLACE FUNCTION increment_stat(stat_key TEXT, amount INT DEFAULT 1)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_value BIGINT;
BEGIN
  -- Only allow authenticated users to increment stats
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to increment stats';
  END IF;

  UPDATE site_stats
  SET value = value + amount,
      updated_at = NOW()
  WHERE key = stat_key
  RETURNING value INTO new_value;

  RETURN COALESCE(new_value, 0);
END;
$$;

-- Only authenticated users can call the increment function
GRANT EXECUTE ON FUNCTION increment_stat(TEXT, INT) TO authenticated;
-- Explicitly revoke from anon
REVOKE EXECUTE ON FUNCTION increment_stat(TEXT, INT) FROM anon;
