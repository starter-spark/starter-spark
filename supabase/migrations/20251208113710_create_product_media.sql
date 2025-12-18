-- Create product_media table for managing product images, videos, 3D models, and documents
CREATE TABLE IF NOT EXISTS product_media (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('image', 'video', '3d_model', 'document')),
  url text NOT NULL,
  storage_path text,
  filename text NOT NULL,
  file_size integer,
  mime_type text,
  alt_text text,
  is_primary boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Index for fast product lookups
CREATE INDEX IF NOT EXISTS idx_product_media_product_id ON product_media(product_id);

-- Index for sorting
CREATE INDEX IF NOT EXISTS idx_product_media_sort ON product_media(product_id, sort_order);

-- Ensure only one primary media per type per product
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_primary_media
ON product_media(product_id, type)
WHERE is_primary = true;

-- Enable RLS
ALTER TABLE product_media ENABLE ROW LEVEL SECURITY;

-- Public can read all media (products are public)
DROP POLICY IF EXISTS "Public read product media" ON product_media;
CREATE POLICY "Public read product media" ON product_media
  FOR SELECT USING (true);

-- Admin/staff can manage media
DROP POLICY IF EXISTS "Admin insert product media" ON product_media;
CREATE POLICY "Admin insert product media" ON product_media
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

DROP POLICY IF EXISTS "Admin update product media" ON product_media;
CREATE POLICY "Admin update product media" ON product_media
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

DROP POLICY IF EXISTS "Admin delete product media" ON product_media;
CREATE POLICY "Admin delete product media" ON product_media
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Function to ensure only one primary image per product when setting a new primary
CREATE OR REPLACE FUNCTION set_primary_product_media()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE product_media 
    SET is_primary = false 
    WHERE product_id = NEW.product_id 
      AND type = NEW.type 
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_primary_product_media ON product_media;
CREATE TRIGGER trigger_set_primary_product_media
BEFORE INSERT OR UPDATE ON product_media
FOR EACH ROW
EXECUTE FUNCTION set_primary_product_media();;
