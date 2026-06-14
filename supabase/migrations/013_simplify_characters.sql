-- =============================================
-- Migration 013: Simplify characters schema
--
-- - Drop `tier` column and its index: gating is now per-pack
--   (`character_packs.requires_premium`) rather than per-character.
-- - Drop `attributes` column: nothing in the app reads it.
-- - Add `slug` column with per-category uniqueness: stable
--   identifier used by the seed script to match rows across runs
--   (renames stay safe).
-- =============================================

DROP INDEX IF EXISTS idx_characters_category_tier;
ALTER TABLE characters DROP COLUMN IF EXISTS tier;
ALTER TABLE characters DROP COLUMN IF EXISTS attributes;

ALTER TABLE characters ADD COLUMN slug TEXT NOT NULL DEFAULT '';
-- Non-partial unique index so the seed script can use ON CONFLICT (category_id, slug).
-- System characters get slugs from data/characters/<id>.json; custom characters get
-- their UUID as the slug at insert time (see src/lib/characters.ts).
CREATE UNIQUE INDEX idx_characters_category_slug
  ON characters(category_id, slug);

CREATE INDEX idx_characters_category_active
  ON characters(category_id)
  WHERE is_active = true;
