import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '../lib/supabase';
import { useGameStore } from '../store/gameStore';
import { getSessionById } from '../lib/session';
import type { GameSession } from '../types/game.types';

export function useRealtimeGame(sessionId: string | null) {
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
    const session = await getSessionById(id);
    if (session) syncFromServer(session);
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

    return () => {
      sub.remove();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [sessionId]);
}
