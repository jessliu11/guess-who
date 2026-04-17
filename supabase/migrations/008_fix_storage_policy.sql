-- =============================================
-- Migration 008: Simplify storage upload policy
-- =============================================
-- The original path-based LIKE check using auth.uid() can fail in the
-- storage schema context. Replace with a role-based check (any
-- authenticated user may upload/update/delete in character-images).
-- Path isolation is enforced at the app level.

DROP POLICY IF EXISTS "custom chars: own upload" ON storage.objects;
DROP POLICY IF EXISTS "custom chars: own update" ON storage.objects;
DROP POLICY IF EXISTS "custom chars: own delete" ON storage.objects;

CREATE POLICY "custom chars: own upload"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'character-images');

CREATE POLICY "custom chars: own update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'character-images');

CREATE POLICY "custom chars: own delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'character-images');
