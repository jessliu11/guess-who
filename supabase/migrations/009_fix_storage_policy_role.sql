-- =============================================
-- Migration 009: Fix storage policy role check
-- =============================================
-- Supabase Storage does not switch the PostgreSQL role to "authenticated".
-- It sets request.jwt.claims instead. Policies with `TO authenticated`
-- are therefore never matched by the storage server.
-- Replace with auth.role() = 'authenticated' in the WITH CHECK / USING clause.

DROP POLICY IF EXISTS "custom chars: own upload" ON storage.objects;
DROP POLICY IF EXISTS "custom chars: own update" ON storage.objects;
DROP POLICY IF EXISTS "custom chars: own delete" ON storage.objects;

CREATE POLICY "custom chars: own upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'character-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "custom chars: own update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'character-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "custom chars: own delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'character-images'
    AND auth.role() = 'authenticated'
  );
