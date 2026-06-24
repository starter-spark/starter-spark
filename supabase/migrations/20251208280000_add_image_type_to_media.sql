-- Add image_type to product_media
-- Kept idempotent because an earlier migration may already define this enum/column.

DO $$
BEGIN
  CREATE TYPE product_image_type AS ENUM (
    'hero',
    'knolling',
    'detail',
    'action',
    'packaging',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE product_media
ADD COLUMN IF NOT EXISTS image_type product_image_type DEFAULT 'other';

CREATE INDEX IF NOT EXISTS idx_product_media_image_type
ON product_media(product_id, image_type);

COMMENT ON COLUMN product_media.image_type IS
'Semantic type of image: hero (main), knolling (flat lay), detail (close-up), action (in use), packaging (box), other';