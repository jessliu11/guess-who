-- =============================================
-- Migration 002: Row Level Security Policies
-- =============================================

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: own read"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: own update"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- CATEGORIES (public read)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories: public read"
  ON categories FOR SELECT
  USING (true);

-- CHARACTERS (public read)
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "characters: public read"
  ON characters FOR SELECT
  USING (true);

-- CHARACTER PACKS
ALTER TABLE character_packs ENABLE ROW LEVEL SECURITY;

-- Public can read system packs or their own packs
CREATE POLICY "packs: read system or own"
  ON character_packs FOR SELECT
  USING (
    is_system = true
    OR creator_id = auth.uid()
    OR (
      -- Allow reading any pack by share_code lookup (needed for join by pack code)
      true
    )
  );

-- Only authenticated users can create packs (premium check handled server-side in Edge Function)
CREATE POLICY "packs: authenticated insert"
  ON character_packs FOR INSERT
  WITH CHECK (auth.uid() = creator_id AND creator_id IS NOT NULL);

-- Owners can update/delete their own non-system packs
CREATE POLICY "packs: own update"
  ON character_packs FOR UPDATE
  USING (creator_id = auth.uid() AND is_system = false);

CREATE POLICY "packs: own delete"
  ON character_packs FOR DELETE
  USING (creator_id = auth.uid() AND is_system = false);

-- GAME SESSIONS
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions: participant read"
  ON game_sessions FOR SELECT
  USING (auth.uid() = host_id OR auth.uid() = guest_id);

-- Host creates session
CREATE POLICY "sessions: host insert"
  ON game_sessions FOR INSERT
  WITH CHECK (auth.uid() = host_id);

-- Both participants can update
CREATE POLICY "sessions: participant update"
  ON game_sessions FOR UPDATE
  USING (auth.uid() = host_id OR auth.uid() = guest_id);

-- Allow anonymous users to join sessions (via join_code lookup)
-- We need a special policy for the guest_id update where guest reads the session first
CREATE POLICY "sessions: join by code (anonymous)"
  ON game_sessions FOR SELECT
  USING (status = 'waiting');  -- anyone can find a waiting session

-- GAME MOVES
ALTER TABLE game_moves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "moves: participant read"
  ON game_moves FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM game_sessions gs
      WHERE gs.id = session_id
        AND (gs.host_id = auth.uid() OR gs.guest_id = auth.uid())
    )
  );

CREATE POLICY "moves: participant insert"
  ON game_moves FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_sessions gs
      WHERE gs.id = session_id
        AND (gs.host_id = auth.uid() OR gs.guest_id = auth.uid())
    )
  );
