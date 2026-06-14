-- =============================================
-- Migration 014: ON DELETE SET NULL on game_sessions character + pack refs
--
-- Today game_sessions.host_character_id, guest_character_id, and pack_id
-- block character/pack deletion (default NO ACTION). That forced
-- migration 013 to wipe all sessions before deleting the legacy system
-- characters. Once real users exist, that approach is too destructive.
--
-- Switch to ON DELETE SET NULL so the seed script can drop obsolete
-- system content without touching sessions:
--   - In-progress games degrade gracefully (UI handles nullable refs).
--   - Finished games persist as historical records with null character
--     refs (consider a retention sweep later).
--
-- Postgres requires drop + re-add to change the action.
-- =============================================

ALTER TABLE game_sessions
  DROP CONSTRAINT IF EXISTS game_sessions_host_character_id_fkey,
  ADD CONSTRAINT game_sessions_host_character_id_fkey
    FOREIGN KEY (host_character_id) REFERENCES characters(id) ON DELETE SET NULL;

ALTER TABLE game_sessions
  DROP CONSTRAINT IF EXISTS game_sessions_guest_character_id_fkey,
  ADD CONSTRAINT game_sessions_guest_character_id_fkey
    FOREIGN KEY (guest_character_id) REFERENCES characters(id) ON DELETE SET NULL;

ALTER TABLE game_sessions
  DROP CONSTRAINT IF EXISTS game_sessions_pack_id_fkey,
  ADD CONSTRAINT game_sessions_pack_id_fkey
    FOREIGN KEY (pack_id) REFERENCES character_packs(id) ON DELETE SET NULL;
