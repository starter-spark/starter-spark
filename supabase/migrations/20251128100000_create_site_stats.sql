-- Create site_stats table for homepage dynamic stats
-- This table stores configurable stats that can be either manually set or derived from data

CREATE TABLE IF NOT EXISTS site_stats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text UNIQUE NOT NULL,
  value integer NOT NULL DEFAULT 0,
  label text NOT NULL,
  suffix text DEFAULT '',
  description text,
  is_auto_calculated boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE site_stats ENABLE ROW LEVEL SECURITY;

-- Public can read stats
CREATE POLICY "Anyone can read site stats" ON site_stats
  FOR SELECT USING (true);

-- Only admins can modify stats
CREATE POLICY "Admins can manage site stats" ON site_stats
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Insert default stats
INSERT INTO site_stats (key, value, label, suffix, description, is_auto_calculated, sort_order) VALUES
  ('kits_deployed', 0, 'Kits Deployed', '', 'Total number of kits sold/deployed (auto-calculated from claimed licenses)', true, 1),
  ('schools_supported', 1, 'Schools Supported', '', 'Number of schools we have supported with kits or workshops', false, 2),
  ('workshops_hosted', 0, 'Workshops Hosted', '', 'Total number of workshops hosted (auto-calculated from past events)', true, 3);

-- Create a function to get calculated stats
-- This allows us to derive stats from actual data when is_auto_calculated = true
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
      -- Auto-calculate kits_deployed from claimed licenses
      WHEN s.key = 'kits_deployed' AND s.is_auto_calculated THEN
        COALESCE((SELECT COUNT(*)::integer FROM licenses WHERE owner_id IS NOT NULL), 0)
      -- Auto-calculate workshops_hosted from past events
      WHEN s.key = 'workshops_hosted' AND s.is_auto_calculated THEN
        COALESCE((SELECT COUNT(*)::integer FROM events WHERE event_date < NOW() AND is_public = true), 0)
      -- Use stored value for manual stats
      ELSE s.value
    END as value,
    s.label,
    s.suffix
  FROM site_stats s
  ORDER BY s.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to everyone (stats are public)
GRANT EXECUTE ON FUNCTION get_site_stats() TO anon, authenticated;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_site_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER site_stats_updated_at
  BEFORE UPDATE ON site_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_site_stats_updated_at();
