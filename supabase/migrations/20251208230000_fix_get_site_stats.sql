-- Fix get_site_stats function to use correct column names and auto_source values
-- Drop existing function first (return type changed)
DROP FUNCTION IF EXISTS get_site_stats();

CREATE OR REPLACE FUNCTION get_site_stats()
RETURNS TABLE (
  key text,
  label text,
  suffix text,
  value integer
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
    SELECT s.key, s.label, s.suffix, s.value, s.is_auto_calculated, s.auto_source
    FROM site_stats s
    ORDER BY s.sort_order ASC, s.created_at ASC
  LOOP
    -- Calculate value if auto_calculated
    IF stat_row.is_auto_calculated AND stat_row.auto_source IS NOT NULL THEN
      CASE stat_row.auto_source
        WHEN 'licenses_count' THEN
          SELECT COUNT(*) INTO calculated_value FROM licenses WHERE owner_id IS NOT NULL;
        WHEN 'events_count' THEN
          SELECT COUNT(*) INTO calculated_value FROM events WHERE is_public = true;
        WHEN 'profiles_count' THEN
          SELECT COUNT(*) INTO calculated_value FROM profiles;
        WHEN 'products_count' THEN
          SELECT COUNT(*) INTO calculated_value FROM products WHERE status = 'active';
        WHEN 'posts_count' THEN
          SELECT COUNT(*) INTO calculated_value FROM posts;
        ELSE
          calculated_value := stat_row.value;
      END CASE;
    ELSE
      calculated_value := stat_row.value;
    END IF;

    key := stat_row.key;
    label := stat_row.label;
    suffix := COALESCE(stat_row.suffix, '');
    value := calculated_value;
    RETURN NEXT;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION get_site_stats() IS 'Returns site stats with auto-calculated values where applicable';
