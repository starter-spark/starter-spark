-- Fix track_teapot_view to count from teapot_viewers directly
-- instead of using site_stats (which no longer has teapot_views row)
CREATE OR REPLACE FUNCTION public.track_teapot_view()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id UUID;
  viewer_count BIGINT;
BEGIN
  -- Get current user
  current_user_id := auth.uid();

  -- If authenticated, try to record the view
  IF current_user_id IS NOT NULL THEN
    INSERT INTO teapot_viewers (user_id)
    VALUES (current_user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- Return count of unique viewers from teapot_viewers table
  SELECT COUNT(*) INTO viewer_count FROM teapot_viewers;

  RETURN viewer_count;
END;
$$;
