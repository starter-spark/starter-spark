-- Remove teapot easter egg stats from public site_stats display
-- These were showing up on the homepage/marketing pages unintentionally
-- The teapot_viewers table is kept for unique view tracking

DELETE FROM site_stats WHERE key IN ('teapot_views', 'teapot_api_calls');
