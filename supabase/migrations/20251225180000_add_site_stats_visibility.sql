-- Add visible_on column to site_stats for page-level visibility control
-- This allows admins to choose which stats appear on which pages

ALTER TABLE site_stats
ADD COLUMN IF NOT EXISTS visible_on text[] DEFAULT ARRAY['home']::text[];

-- Update existing stats to show on home by default
UPDATE site_stats SET visible_on = ARRAY['home'] WHERE visible_on IS NULL;

-- Make visible_on NOT NULL now that we've set defaults
ALTER TABLE site_stats ALTER COLUMN visible_on SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN site_stats.visible_on IS 'Array of page keys where this stat should be displayed (e.g., home, about, workshop)';

-- Drop the old get_site_stats function (no parameters)
DROP FUNCTION IF EXISTS get_site_stats();

-- Create updated get_site_stats function with optional page filter
CREATE OR REPLACE FUNCTION get_site_stats(page_filter text DEFAULT NULL)
RETURNS TABLE (
  key text,
  value integer,
  label text,
  suffix text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stat_row RECORD;
  calculated_value integer;
BEGIN
  FOR stat_row IN
    SELECT
      s.key,
      s.value,
      s.label,
      s.suffix,
      s.is_auto_calculated,
      s.auto_source,
      s.visible_on
    FROM site_stats s
    WHERE
      -- If page_filter is NULL, return all stats
      -- Otherwise, only return stats visible on that page
      (page_filter IS NULL OR page_filter = ANY(s.visible_on))
    ORDER BY s.sort_order ASC
  LOOP
    -- Calculate value if auto-calculated
    IF stat_row.is_auto_calculated = true AND stat_row.auto_source IS NOT NULL THEN
      CASE stat_row.auto_source
        WHEN 'licenses_count' THEN
          SELECT COUNT(*) INTO calculated_value FROM licenses WHERE owner_id IS NOT NULL;
        WHEN 'events_count' THEN
          SELECT COUNT(*) INTO calculated_value FROM events WHERE is_public = true AND event_date < now();
        WHEN 'profiles_count' THEN
          SELECT COUNT(*) INTO calculated_value FROM profiles;
        WHEN 'products_count' THEN
          SELECT COUNT(*) INTO calculated_value FROM products WHERE status = 'active';
        WHEN 'posts_count' THEN
          SELECT COUNT(*) INTO calculated_value FROM posts;
        WHEN 'comments_count' THEN
          SELECT COUNT(*) INTO calculated_value FROM post_comments;
        ELSE
          calculated_value := stat_row.value;
      END CASE;
    ELSE
      calculated_value := stat_row.value;
    END IF;

    key := stat_row.key;
    value := calculated_value;
    label := stat_row.label;
    suffix := COALESCE(stat_row.suffix, '');
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Grant execute to authenticated and anon users
GRANT EXECUTE ON FUNCTION get_site_stats(text) TO authenticated, anon;
