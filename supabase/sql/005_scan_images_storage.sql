-- Scan images storage for AI Makeup VTO (run once in Supabase SQL Editor)
-- Fixes: {"statusCode":"403","message":"new row violates row-level security policy"}

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'scan-images',
  'scan-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "Scan images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own scan images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own scan images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own scan images" ON storage.objects;

CREATE POLICY "Scan images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'scan-images');

CREATE POLICY "Users can upload their own scan images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'scan-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own scan images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'scan-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own scan images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'scan-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
