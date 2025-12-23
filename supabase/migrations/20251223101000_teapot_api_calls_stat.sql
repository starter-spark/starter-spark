-- Add separate counter for API calls to the teapot endpoint
INSERT INTO site_stats (key, value, label, suffix, description, is_auto_calculated, sort_order)
VALUES ('teapot_api_calls', 0, 'Teapot API Calls', '', 'Total calls to the 418 teapot API endpoint', false, 101)
ON CONFLICT (key) DO NOTHING;
