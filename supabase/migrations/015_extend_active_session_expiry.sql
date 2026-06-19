-- When a session transitions to 'active', extend expires_at to 24 hours from now
-- so that in-progress games never expire mid-play.
CREATE OR REPLACE FUNCTION extend_session_expiry_on_active()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'active' AND OLD.status <> 'active' THEN
    NEW.expires_at := NOW() + INTERVAL '24 hours';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_extend_session_expiry_on_active
  BEFORE UPDATE ON game_sessions
  FOR EACH ROW EXECUTE FUNCTION extend_session_expiry_on_active();
