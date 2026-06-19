import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '../lib/supabase';
import { useGameStore } from '../store/gameStore';
import { getSessionById } from '../lib/session';
import type { GameSession } from '../types/game.types';

function isExpired(session: GameSession): boolean {
  return (
    new Date(session.expires_at) < new Date() &&
    session.status !== 'finished' &&
    session.status !== 'abandoned'
  );
}

export function useRealtimeGame(
  sessionId: string | null,
  onExpired?: () => void,
) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const syncFromServer = useGameStore((s) => s.syncFromServer);

  const subscribe = (id: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    channelRef.current = supabase
      .channel(`game:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          syncFromServer(payload.new as GameSession);
        },
      )
      .subscribe();
  };

  const refetch = async (id: string) => {
    try {
      const session = await getSessionById(id);
      if (!session) return;
      if (isExpired(session)) {
        onExpired?.();
        return;
      }
      syncFromServer(session);
    } catch {
      // transient error — next poll will retry
    }
  };

  useEffect(() => {
    if (!sessionId) return;

    subscribe(sessionId);

    const handleAppState = (nextState: AppStateStatus) => {
      if (!sessionId) return;
      if (nextState === 'active') {
        refetch(sessionId);
        subscribe(sessionId);
      } else {
        channelRef.current && supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);

    // Polling fallback — realtime postgres_changes can silently miss events
    // for registered (email/password) sessions.
    const poll = setInterval(() => refetch(sessionId), 3000);

    return () => {
      sub.remove();
      clearInterval(poll);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [sessionId]);
}
