-- =============================================
-- Migration 013: Simplify characters schema
--
-- - Drop `tier` column and its index: gating is now per-pack
--   (`character_packs.requires_premium`) rather than per-character.
-- - Drop `attributes` column: nothing in the app reads it.
-- - Add `slug` column with per-category uniqueness: stable
--   identifier used by the seed script to match rows across runs
--   (renames stay safe).
-- - Wipe existing system characters: the seed script (npm run seed)
--   is the new source of truth; rows get re-inserted with proper slugs.
-- - Backfill custom-character slugs to their UUID (matches the insert
--   path in src/lib/characters.ts).
-- =============================================

DROP INDEX IF EXISTS idx_characters_category_tier;
ALTER TABLE characters DROP COLUMN IF EXISTS tier;
ALTER TABLE characters DROP COLUMN IF EXISTS attributes;

ALTER TABLE characters ADD COLUMN slug TEXT NOT NULL DEFAULT '';

-- Clear all game_sessions first: they reference characters/packs via FK with no
-- ON DELETE clause. game_moves cascades automatically via its session_id FK.
-- The app has no external users; surviving rows would point at character_ids and
-- pack_ids that no longer exist after the seed runs anyway.
DELETE FROM game_sessions;

-- Clear out system content so it can be reseeded cleanly with proper slugs.
-- User-generated rows (creator_id IS NOT NULL) are preserved.
DELETE FROM characters WHERE creator_id IS NULL;

-- Custom characters get their UUID as the slug, matching the insert in
-- src/lib/characters.ts. Guarantees uniqueness within category_id='custom'.
UPDATE characters SET slug = id::text WHERE creator_id IS NOT NULL;

-- Non-partial unique index so the seed script can use ON CONFLICT (category_id, slug).
-- System characters get slugs from data/characters/<id>.json; custom characters use their UUID.
CREATE UNIQUE INDEX idx_characters_category_slug
  ON characters(category_id, slug);

CREATE INDEX idx_characters_category_active
  ON characters(category_id)
  WHERE is_active = true;
