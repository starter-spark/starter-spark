-- Track unique teapot viewers to prevent duplicate counting
-- Only stores user_id, no other identifying info

CREATE TABLE IF NOT EXISTS teapot_viewers (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: No one can read or write directly (only via function)
ALTER TABLE teapot_viewers ENABLE ROW LEVEL SECURITY;

-- No policies = no direct access. Only SECURITY DEFINER functions can access.

-- Replace increment_stat with a teapot-specific function that tracks unique views
CREATE OR REPLACE FUNCTION track_teapot_view()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  was_inserted BOOLEAN;
  new_count BIGINT;
BEGIN
  -- Get current user
  current_user_id := auth.uid();

  -- Must be authenticated
  IF current_user_id IS NULL THEN
    -- Return current count without incrementing
    SELECT value INTO new_count FROM site_stats WHERE key = 'teapot_views';
    RETURN COALESCE(new_count, 0);
  END IF;

  -- Try to insert - will fail silently if already exists
  INSERT INTO teapot_viewers (user_id)
  VALUES (current_user_id)
  ON CONFLICT (user_id) DO NOTHING
  RETURNING TRUE INTO was_inserted;

  -- Only increment if this is a new viewer
  IF was_inserted THEN
    UPDATE site_stats
    SET value = value + 1,
        updated_at = NOW()
    WHERE key = 'teapot_views'
    RETURNING value INTO new_count;
  ELSE
    -- Just get current count
    SELECT value INTO new_count FROM site_stats WHERE key = 'teapot_views';
  END IF;

  RETURN COALESCE(new_count, 0);
END;
$$;

-- Grant execute to authenticated users only
GRANT EXECUTE ON FUNCTION track_teapot_view() TO authenticated;
REVOKE EXECUTE ON FUNCTION track_teapot_view() FROM anon;
REVOKE EXECUTE ON FUNCTION track_teapot_view() FROM public;
