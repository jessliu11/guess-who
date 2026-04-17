-- =============================================
-- Migration 007: Custom Characters
-- =============================================
-- Allows users to create their own characters with uploaded photos.
-- Custom characters live in the shared `characters` table, distinguished
-- by a non-null `creator_id`.

-- 1. Seed the "custom" category
INSERT INTO categories (id, label, description, sort_order)
VALUES ('custom', 'My Characters', 'Characters you have created', 99)
ON CONFLICT (id) DO NOTHING;

-- 2. Add creator_id to characters
ALTER TABLE characters
ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_characters_creator ON characters(creator_id)
WHERE creator_id IS NOT NULL;

-- 3. RLS — users can insert / update / delete their own characters
--    (public read already covered by existing "characters: public read" policy)

CREATE POLICY "characters: own insert"
  ON characters FOR INSERT
  WITH CHECK (auth.uid() = creator_id AND creator_id IS NOT NULL);

CREATE POLICY "characters: own update"
  ON characters FOR UPDATE
  USING (creator_id = auth.uid());

CREATE POLICY "characters: own delete"
  ON characters FOR DELETE
  USING (creator_id = auth.uid());

-- 4. Supabase Storage policies for the existing character-images bucket.
--    Users may upload/update/delete only inside their own custom/ sub-folder.

CREATE POLICY "custom chars: own upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'character-images'
    AND auth.uid() IS NOT NULL
    AND name LIKE 'custom/' || auth.uid()::text || '/%'
  );

CREATE POLICY "custom chars: own update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'character-images'
    AND name LIKE 'custom/' || auth.uid()::text || '/%'
  );

CREATE POLICY "custom chars: own delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'character-images'
    AND name LIKE 'custom/' || auth.uid()::text || '/%'
  );
