-- Phase 14.1: Product Tags System
-- Creates the product_tags table for flexible product labeling

-- Create enum for allowed tag types
CREATE TYPE product_tag_type AS ENUM (
  'featured',
  'discount',
  'new',
  'bestseller',
  'limited',
  'bundle',
  'out_of_stock'
);
-- Create product_tags table
CREATE TABLE product_tags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag product_tag_type NOT NULL,
  priority integer DEFAULT 0,
  -- For discount tag, stores the percentage
  discount_percent integer CHECK (discount_percent IS NULL OR (discount_percent > 0 AND discount_percent <= 100)),
  created_at timestamptz DEFAULT now(),
  -- Each product can only have one of each tag type
  UNIQUE(product_id, tag)
);
-- Create index for efficient querying
CREATE INDEX idx_product_tags_product_id ON product_tags(product_id);
CREATE INDEX idx_product_tags_tag ON product_tags(tag);
-- Enable RLS
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;
-- Public can read all tags
CREATE POLICY "Public can read product tags"
  ON product_tags
  FOR SELECT
  USING (true);
-- Only admins/staff can manage tags
CREATE POLICY "Admins can manage product tags"
  ON product_tags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );
-- Comment on table
COMMENT ON TABLE product_tags IS 'Tags for products (featured, discount, new, etc.)';
COMMENT ON COLUMN product_tags.priority IS 'Higher priority = shown first. Used for tag ordering.';
COMMENT ON COLUMN product_tags.discount_percent IS 'Only used when tag is discount. Percentage off (1-100).';
