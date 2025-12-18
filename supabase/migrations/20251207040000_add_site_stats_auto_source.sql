-- Add auto_source column to site_stats for selecting which data to auto-calculate from
-- This allows admins to choose the source when is_auto_calculated is true

ALTER TABLE site_stats ADD COLUMN IF NOT EXISTS auto_source text;
-- Add comment explaining the column
COMMENT ON COLUMN site_stats.auto_source IS 'The data source for auto-calculation: licenses_count, events_count, profiles_count, posts_count, comments_count';
-- Update existing auto-calculated stats with their current source based on key
UPDATE site_stats
SET auto_source = CASE
  WHEN key = 'kits_deployed' THEN 'licenses_count'
  WHEN key = 'workshops_hosted' THEN 'events_count'
  ELSE NULL
END
WHERE is_auto_calculated = true;
-- Update the get_site_stats function to use auto_source column
CREATE OR REPLACE FUNCTION get_site_stats()
RETURNS TABLE (
  key text,
  value integer,
  label text,
  suffix text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.key,
    CASE
      -- Use auto_source column to determine which data to fetch
      WHEN s.is_auto_calculated = true AND s.auto_source = 'licenses_count' THEN
        COALESCE((SELECT COUNT(*)::integer FROM licenses WHERE owner_id IS NOT NULL), 0)
      WHEN s.is_auto_calculated = true AND s.auto_source = 'events_count' THEN
        COALESCE((SELECT COUNT(*)::integer FROM events WHERE event_date < NOW() AND is_public = true), 0)
      WHEN s.is_auto_calculated = true AND s.auto_source = 'profiles_count' THEN
        COALESCE((SELECT COUNT(*)::integer FROM profiles), 0)
      WHEN s.is_auto_calculated = true AND s.auto_source = 'posts_count' THEN
        COALESCE((SELECT COUNT(*)::integer FROM posts WHERE status = 'published'), 0)
      WHEN s.is_auto_calculated = true AND s.auto_source = 'comments_count' THEN
        COALESCE((SELECT COUNT(*)::integer FROM comments), 0)
      -- Use stored value for manual stats or unknown auto_source
      ELSE s.value
    END as value,
    s.label,
    s.suffix
  FROM site_stats s
  ORDER BY s.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';
-- Grant execute permission to everyone (stats are public)
GRANT EXECUTE ON FUNCTION get_site_stats() TO anon, authenticated;
