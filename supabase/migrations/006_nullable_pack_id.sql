-- =============================================
-- Migration 006: Make pack_id nullable
-- =============================================
-- Games can now be created from a custom mix of characters across
-- multiple packs, so there is no single canonical pack to reference.

ALTER TABLE game_sessions ALTER COLUMN pack_id DROP NOT NULL;
