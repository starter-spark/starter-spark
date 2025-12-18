-- Create storage buckets for media assets
-- Note: These need to be created via SQL since we're using migrations

-- Products bucket (public read) - for product images, videos, documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products', 
  'products', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'application/pdf', 'model/gltf-binary', 'model/gltf+json']
) ON CONFLICT (id) DO NOTHING;
-- Team photos bucket (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'team', 
  'team', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;
-- Gallery bucket (public read) - for about page gallery, event photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gallery', 
  'gallery', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;
-- 3D Models bucket (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'models', 
  'models', 
  true,
  104857600, -- 100MB limit for 3D models
  ARRAY['model/gltf-binary', 'model/gltf+json', 'application/octet-stream']
) ON CONFLICT (id) DO NOTHING;
-- RLS Policies for all buckets
-- Public can read from all buckets (since they're public)
-- Only authenticated admins/staff can upload, update, delete

-- Products bucket policies
CREATE POLICY "Public read products" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Admin upload products" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'products' 
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );
CREATE POLICY "Admin update products" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'products' 
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );
CREATE POLICY "Admin delete products" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'products' 
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );
-- Team bucket policies
CREATE POLICY "Public read team" ON storage.objects
  FOR SELECT USING (bucket_id = 'team');
CREATE POLICY "Admin upload team" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'team' 
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );
CREATE POLICY "Admin update team" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'team' 
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );
CREATE POLICY "Admin delete team" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'team' 
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );
-- Gallery bucket policies
CREATE POLICY "Public read gallery" ON storage.objects
  FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Admin upload gallery" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'gallery' 
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );
CREATE POLICY "Admin update gallery" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'gallery' 
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );
CREATE POLICY "Admin delete gallery" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'gallery' 
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );
-- Models bucket policies
CREATE POLICY "Public read models" ON storage.objects
  FOR SELECT USING (bucket_id = 'models');
CREATE POLICY "Admin upload models" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'models' 
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );
CREATE POLICY "Admin update models" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'models' 
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );
CREATE POLICY "Admin delete models" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'models' 
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );
