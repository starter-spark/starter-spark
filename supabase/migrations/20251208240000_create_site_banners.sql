-- Create site_banners table for admin-managed announcements
CREATE TABLE site_banners (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL, -- Admin reference name
  message text NOT NULL,
  link_url text,
  link_text text,
  icon text, -- Lucide icon name (e.g., 'info', 'alert-triangle')
  color_scheme text DEFAULT 'info' CHECK (color_scheme IN ('info', 'warning', 'success', 'error', 'promo')),
  pages text[] DEFAULT '{}', -- ['/', '/shop', '/workshop'] or ['*'] for all pages
  is_dismissible boolean DEFAULT true,
  dismiss_duration_hours integer, -- null = forever dismissed, number = re-shows after X hours
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create index for efficient querying of active banners
CREATE INDEX idx_site_banners_active ON site_banners (is_active, starts_at, ends_at);
CREATE INDEX idx_site_banners_sort ON site_banners (sort_order, created_at);

-- Enable RLS
ALTER TABLE site_banners ENABLE ROW LEVEL SECURITY;

-- Public can read active banners within their scheduled time window
CREATE POLICY "Public read active banners"
  ON site_banners FOR SELECT
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at > now())
  );

-- Admins can do everything
CREATE POLICY "Admin manage banners"
  ON site_banners FOR ALL
  USING (is_admin());

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_site_banners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER site_banners_updated_at
  BEFORE UPDATE ON site_banners
  FOR EACH ROW
  EXECUTE FUNCTION update_site_banners_updated_at();

-- Add comment
COMMENT ON TABLE site_banners IS 'Site-wide announcement banners manageable by admins';
COMMENT ON COLUMN site_banners.pages IS 'Array of page paths where banner shows. Use ["*"] for all pages.';
COMMENT ON COLUMN site_banners.dismiss_duration_hours IS 'Hours until dismissed banner reappears. NULL means permanently dismissed.';
