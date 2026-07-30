-- Bucket: doc-attachments. public = true serves any object at its public
-- URL without an RLS check; paths embed a server-minted UUID, so drafts
-- stay unguessable only as long as object names cannot be enumerated. The
-- SELECT policy below therefore restricts list()/metadata to attachments
-- of published pages, mirroring the doc_attachments table RLS.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'doc-attachments',
  'doc-attachments',
  true,
  10485760, -- 10MB
  ARRAY[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'application/zip',
    'application/x-zip-compressed',
    'text/plain',
    'text/csv'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS policies for doc-attachments bucket.
-- Writes are server-side only (service role; uploads go through signed
-- upload URLs minted by admin server actions).

DROP POLICY IF EXISTS "Public can read doc attachments" ON storage.objects;
DROP POLICY IF EXISTS "Service role can insert doc attachments" ON storage.objects;
DROP POLICY IF EXISTS "Service role can read doc attachments" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete doc attachments" ON storage.objects;

CREATE POLICY "Public can read doc attachments"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'doc-attachments'
  AND EXISTS (
    SELECT 1
    FROM public.doc_attachments a
    JOIN public.doc_pages p ON p.id = a.page_id
    WHERE a.storage_path = storage.objects.name
      AND p.is_published = true
  )
);

CREATE POLICY "Service role can insert doc attachments"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'doc-attachments');

CREATE POLICY "Service role can read doc attachments"
ON storage.objects
FOR SELECT
TO service_role
USING (bucket_id = 'doc-attachments');

CREATE POLICY "Service role can delete doc attachments"
ON storage.objects
FOR DELETE
TO service_role
USING (bucket_id = 'doc-attachments');
