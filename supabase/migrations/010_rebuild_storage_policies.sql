-- =============================================
-- Migration 010: Rebuild storage bucket + policies
-- =============================================
-- Ensures the character-images bucket exists and rebuilds all
-- storage policies using auth.uid() IS NOT NULL, which is the
-- most reliable auth check in Supabase Storage context.

-- 1. Ensure the bucket exists (public so image URLs work without signed URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('character-images', 'character-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop all previous iterations of these policies
DROP POLICY IF EXISTS "custom chars: own upload" ON storage.objects;
DROP POLICY IF EXISTS "custom chars: own update" ON storage.objects;
DROP POLICY IF EXISTS "custom chars: own delete" ON storage.objects;
DROP POLICY IF EXISTS "character-images: upload"  ON storage.objects;
DROP POLICY IF EXISTS "character-images: update"  ON storage.objects;
DROP POLICY IF EXISTS "character-images: delete"  ON storage.objects;
DROP POLICY IF EXISTS "character-images: read"    ON storage.objects;

-- 3. Public read — anyone can view character images
CREATE POLICY "character-images: read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'character-images');

-- 4. Authenticated upload/update/delete — auth.uid() IS NOT NULL is the
--    most reliable check in Storage; it decodes the JWT sub claim directly.
CREATE POLICY "character-images: upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'character-images'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "character-images: update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'character-images'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "character-images: delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'character-images'
    AND auth.uid() IS NOT NULL
  );
