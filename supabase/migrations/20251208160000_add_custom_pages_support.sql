-- Add support for dynamic custom markdown pages
-- These are pages that admins can create without developer intervention

-- Add columns to page_content for custom pages
ALTER TABLE page_content ADD COLUMN IF NOT EXISTS is_custom_page boolean DEFAULT false;
ALTER TABLE page_content ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE page_content ADD COLUMN IF NOT EXISTS seo_title text;
ALTER TABLE page_content ADD COLUMN IF NOT EXISTS seo_description text;
-- Create unique index on slug for custom pages (only enforce uniqueness when is_custom_page is true)
CREATE UNIQUE INDEX IF NOT EXISTS idx_page_content_custom_slug
  ON page_content(slug)
  WHERE is_custom_page = true AND slug IS NOT NULL;
-- Add comments for documentation
COMMENT ON COLUMN page_content.is_custom_page IS 'Whether this is a custom page created by admins (vs system pages like privacy/terms)';
COMMENT ON COLUMN page_content.slug IS 'URL slug for custom pages (e.g., "faq" for /faq)';
COMMENT ON COLUMN page_content.seo_title IS 'Custom SEO title for the page (defaults to title if not set)';
COMMENT ON COLUMN page_content.seo_description IS 'SEO meta description for the page';
