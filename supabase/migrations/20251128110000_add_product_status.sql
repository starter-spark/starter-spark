-- Add status column to products table for Coming Soon and Draft functionality
-- This allows products to be in different states: active, coming_soon, draft

-- Create enum type for product status
DO $$ BEGIN
    CREATE TYPE product_status AS ENUM ('active', 'coming_soon', 'draft');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
-- Add status column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS status product_status NOT NULL DEFAULT 'active';
-- Add index for filtering by status
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
-- Update existing products to be active
UPDATE products SET status = 'active' WHERE status IS NULL;
-- Add comment for documentation
COMMENT ON COLUMN products.status IS 'Product visibility status: active (visible and purchasable), coming_soon (visible but not purchasable), draft (hidden)';
