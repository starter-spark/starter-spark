-- Phase 14.3: Add discount system columns to products table
-- This allows products to have time-limited discounts with original price preservation

-- Add discount columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percent integer
  CHECK (discount_percent IS NULL OR (discount_percent > 0 AND discount_percent <= 100));
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_expires_at timestamptz;
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price_cents integer
  CHECK (original_price_cents IS NULL OR original_price_cents > 0);
-- Add index for querying active discounts
CREATE INDEX IF NOT EXISTS idx_products_discount_expires
  ON products(discount_expires_at)
  WHERE discount_expires_at IS NOT NULL;
-- Comment explaining the discount logic
COMMENT ON COLUMN products.discount_percent IS 'Percentage discount (1-100). When set, price_cents becomes the discounted price.';
COMMENT ON COLUMN products.discount_expires_at IS 'When the discount expires. NULL means no expiration.';
COMMENT ON COLUMN products.original_price_cents IS 'Original price before discount. Used for strikethrough display.';
