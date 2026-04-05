-- =============================================
-- Migration 005: Fix guest join RLS policy
-- =============================================
-- The original "sessions: participant update" policy requires the user to already
-- be host_id or guest_id. When a guest is joining, guest_id is still NULL, so
-- the UPDATE is blocked. This adds a dedicated policy for the join action.

CREATE POLICY "sessions: guest join"
  ON game_sessions FOR UPDATE
  USING (
    status = 'waiting'
    AND guest_id IS NULL
    AND auth.uid() IS NOT NULL
    AND auth.uid() != host_id
  )
  WITH CHECK (
    auth.uid() = guest_id
  );
