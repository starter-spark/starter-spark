-- Add expiration support for product tags
-- Particularly useful for "new" tag which should auto-expire

-- Add expires_at column to product_tags
ALTER TABLE product_tags ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT NULL;

-- Update the new product tag trigger to set expiration (7 days by default)
CREATE OR REPLACE FUNCTION update_new_product_tag()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Add "new" tag to newly created products with 7-day expiration
  INSERT INTO product_tags (product_id, tag, priority, expires_at)
  VALUES (NEW.id, 'new', 50, NOW() + INTERVAL '7 days')
  ON CONFLICT (product_id, tag) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up expired tags (can be called by cron or on query)
CREATE OR REPLACE FUNCTION cleanup_expired_tags()
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM product_tags
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create index for expired tag queries
CREATE INDEX IF NOT EXISTS idx_product_tags_expires_at
  ON product_tags(expires_at)
  WHERE expires_at IS NOT NULL;

-- Comment
COMMENT ON COLUMN product_tags.expires_at IS 'When this tag expires and should be auto-removed. NULL means no expiration.';
