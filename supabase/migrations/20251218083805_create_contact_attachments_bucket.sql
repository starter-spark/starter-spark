-- Create storage bucket for contact form attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contact-attachments',
  'contact-attachments',
  false, -- Private bucket - files accessed via signed URLs only
  52428800, -- 50MB max file size
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS policies for contact-attachments bucket
-- Only service role can insert (server-side uploads only)
-- This prevents direct client uploads which could be abused

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can insert contact attachments" ON storage.objects;
DROP POLICY IF EXISTS "Service role can read contact attachments" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read contact attachments" ON storage.objects;

-- Allow service role to insert files (server-side only)
CREATE POLICY "Service role can insert contact attachments"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'contact-attachments');

-- Allow service role to read files
CREATE POLICY "Service role can read contact attachments"
ON storage.objects
FOR SELECT
TO service_role
USING (bucket_id = 'contact-attachments');

-- Allow admins to read attachments
CREATE POLICY "Admins can read contact attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'contact-attachments'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'staff')
  )
);

-- Update contact_submissions table to use jsonb array for attachments
-- (it already has an attachments column, but let's ensure it's the right type)
COMMENT ON COLUMN contact_submissions.attachments IS 'JSON array of attachment objects: [{name: string, path: string, size: number, type: string}]';
