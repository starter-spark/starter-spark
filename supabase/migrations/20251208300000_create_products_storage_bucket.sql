-- Create the products storage bucket for media (images, videos, 3D models, documents)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  52428800, -- 50MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'model/gltf-binary',
    'model/gltf+json',
    'application/octet-stream',
    'application/pdf'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Enable public read access to the bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public read access' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Public read access" ON storage.objects
      FOR SELECT USING (bucket_id = 'products');
  END IF;
END $$;

-- Allow authenticated admin/staff to upload
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admin upload access' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Admin upload access" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'products'
        AND EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'staff')
        )
      );
  END IF;
END $$;

-- Allow authenticated admin/staff to delete
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admin delete access' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Admin delete access" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'products'
        AND EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'staff')
        )
      );
  END IF;
END $$;
