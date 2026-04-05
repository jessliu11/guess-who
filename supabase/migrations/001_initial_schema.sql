-- =============================================
-- Migration 001: Initial Schema
-- =============================================

-- Profiles (extends auth.users 1:1)
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    TEXT NOT NULL DEFAULT 'Player',
  avatar_url      TEXT,
  is_premium      BOOLEAN NOT NULL DEFAULT false,
  rc_customer_id  TEXT,
  games_played    INTEGER NOT NULL DEFAULT 0,
  games_won       INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Player')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update updated_at automatically
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Categories (pre-seeded, read-only from client)
CREATE TABLE categories (
  id          TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  description TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- Characters
CREATE TABLE characters (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id TEXT NOT NULL REFERENCES categories(id),
  name        TEXT NOT NULL,
  image_url   TEXT NOT NULL,
  attributes  JSONB NOT NULL DEFAULT '{}',
  tier        TEXT NOT NULL DEFAULT 'standard'
                CHECK (tier IN ('standard', 'extended')),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_characters_category_tier
  ON characters(category_id, tier)
  WHERE is_active = true;

-- Character packs
CREATE TABLE character_packs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  description       TEXT,
  share_code        TEXT NOT NULL UNIQUE,
  creator_id        UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_system         BOOLEAN NOT NULL DEFAULT false,
  requires_premium  BOOLEAN NOT NULL DEFAULT false,
  character_ids     UUID[] NOT NULL DEFAULT '{}',
  preview_image_urls TEXT[] NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_packs_creator ON character_packs(creator_id);
CREATE INDEX idx_packs_share_code ON character_packs(share_code);

CREATE TRIGGER character_packs_updated_at
  BEFORE UPDATE ON character_packs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Game sessions
CREATE TABLE game_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  join_code           TEXT NOT NULL UNIQUE,
  host_id             UUID NOT NULL REFERENCES profiles(id),
  guest_id            UUID REFERENCES profiles(id),
  pack_id             UUID NOT NULL REFERENCES character_packs(id),
  status              TEXT NOT NULL DEFAULT 'waiting'
                        CHECK (status IN ('waiting','selecting','active','finished','abandoned')),
  host_character_id   UUID REFERENCES characters(id),
  guest_character_id  UUID REFERENCES characters(id),
  current_turn        TEXT CHECK (current_turn IN ('host','guest')),
  winner              TEXT CHECK (winner IN ('host','guest')),
  character_pool      UUID[] NOT NULL DEFAULT '{}',
  host_eliminated     UUID[] NOT NULL DEFAULT '{}',
  guest_eliminated    UUID[] NOT NULL DEFAULT '{}',
  turn_count          INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at          TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '2 hours')
);

CREATE INDEX idx_sessions_join_code
  ON game_sessions(join_code)
  WHERE status = 'waiting';

CREATE INDEX idx_sessions_host ON game_sessions(host_id);
CREATE INDEX idx_sessions_guest ON game_sessions(guest_id);

CREATE TRIGGER game_sessions_updated_at
  BEFORE UPDATE ON game_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: when both characters selected, advance status to 'active'
CREATE OR REPLACE FUNCTION check_both_characters_selected()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.host_character_id IS NOT NULL
     AND NEW.guest_character_id IS NOT NULL
     AND NEW.status = 'selecting' THEN
    NEW.status = 'active';
    NEW.current_turn = 'host';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_advance_to_active
  BEFORE UPDATE ON game_sessions
  FOR EACH ROW EXECUTE FUNCTION check_both_characters_selected();

-- Game moves (append-only event log)
CREATE TABLE game_moves (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_role TEXT NOT NULL CHECK (player_role IN ('host','guest')),
  move_type   TEXT NOT NULL CHECK (move_type IN ('eliminate','guess','answer_yes','answer_no')),
  payload     JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_moves_session ON game_moves(session_id, created_at);

-- =============================================
-- submit_guess RPC (atomic guess + win/turn flip)
-- =============================================
CREATE OR REPLACE FUNCTION submit_guess(
  p_session_id            UUID,
  p_player_role           TEXT,
  p_guessed_character_id  UUID
) RETURNS game_sessions LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_session         game_sessions;
  v_correct_id      UUID;
  v_is_correct      BOOLEAN;
BEGIN
  SELECT * INTO v_session
  FROM game_sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF v_session.status != 'active' THEN
    RAISE EXCEPTION 'Game is not active';
  END IF;

  IF v_session.current_turn != p_player_role THEN
    RAISE EXCEPTION 'Not your turn';
  END IF;

  -- Determine correct answer
  v_correct_id := CASE p_player_role
    WHEN 'host' THEN v_session.guest_character_id
    ELSE v_session.host_character_id
  END;

  v_is_correct := (p_guessed_character_id = v_correct_id);

  -- Log the move
  INSERT INTO game_moves (session_id, player_role, move_type, payload)
  VALUES (
    p_session_id,
    p_player_role,
    'guess',
    jsonb_build_object(
      'character_id', p_guessed_character_id,
      'correct', v_is_correct
    )
  );

  IF v_is_correct THEN
    UPDATE game_sessions
    SET status     = 'finished',
        winner     = p_player_role,
        updated_at = NOW()
    WHERE id = p_session_id;

    -- Update stats
    UPDATE profiles SET games_won = games_won + 1
    WHERE id = CASE p_player_role
      WHEN 'host' THEN v_session.host_id
      ELSE v_session.guest_id
    END;

    UPDATE profiles SET games_played = games_played + 1
    WHERE id IN (v_session.host_id, v_session.guest_id);
  ELSE
    -- Wrong guess — flip turn, game continues
    UPDATE game_sessions
    SET current_turn = CASE p_player_role WHEN 'host' THEN 'guest' ELSE 'host' END,
        turn_count   = turn_count + 1,
        updated_at   = NOW()
    WHERE id = p_session_id;
  END IF;

  SELECT * INTO v_session FROM game_sessions WHERE id = p_session_id;
  RETURN v_session;
END;
$$;
