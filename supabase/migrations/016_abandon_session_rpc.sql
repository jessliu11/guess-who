-- abandon_session RPC
-- Marks a session as abandoned and increments games_played for both players
-- (but awards no win). Only counts stats if the game had progressed past
-- 'waiting' (i.e. a guest had joined). Games still in 'waiting' have no
-- guest, so only the host row exists and no stats are meaningful.
CREATE OR REPLACE FUNCTION abandon_session(
  p_session_id UUID
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_session game_sessions;
BEGIN
  SELECT * INTO v_session
  FROM game_sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  -- Only record stats if the game had at least started (guest joined)
  IF v_session.status IN ('selecting', 'active') AND v_session.guest_id IS NOT NULL THEN
    UPDATE profiles
    SET games_played = games_played + 1
    WHERE id IN (v_session.host_id, v_session.guest_id);
  END IF;

  UPDATE game_sessions
  SET status     = 'abandoned',
      updated_at = NOW()
  WHERE id = p_session_id;
END;
$$;
