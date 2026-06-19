import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { CheckCircle2 } from 'lucide-react-native';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { JoinCodeDisplay } from '../../src/components/ui/JoinCodeDisplay';
import { Button } from '../../src/components/ui/Button';
import { ConfirmModal } from '../../src/components/ui/ConfirmModal';
import { getSessionById, abandonSession } from '../../src/lib/session';
import { useGameStore } from '../../src/store/gameStore';
import { supabase } from '../../src/lib/supabase';
import { LOADING_TIMEOUT_MS } from '../../src/constants/config';
import type { GameSession } from '../../src/types/game.types';

export default function Lobby() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const myRole = useGameStore((s) => s.myRole);
  const setSession = useGameStore((s) => s.setSession);

  const [session, setLocalSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [confirmLeaveVisible, setConfirmLeaveVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const dotScale = useSharedValue(1);
  const dotStyle = useAnimatedStyle(() => ({ transform: [{ scale: dotScale.value }] }));

  useEffect(() => {
    dotScale.value = withRepeat(withTiming(1.3, { duration: 700 }), -1, true);
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    let didNavigate = false;
    const advance = (s: GameSession) => {
      if (didNavigate) return;
      didNavigate = true;
      setLocalSession(s);
      setSession(s);
      router.replace(`/(game)/character-select?sessionId=${sessionId}`);
    };

    // Initial load — navigate immediately if we've already passed 'waiting'
    getSessionById(sessionId).then((s) => {
      if (!s) { setLoading(false); return; }
      setLocalSession(s);
      setSession(s);
      if (s.status === 'selecting' || s.status === 'active') {
        advance(s);
        return;
      }
      setLoading(false);
    });

    // Realtime subscription
    const channel = supabase
      .channel(`lobby:${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_sessions', filter: `id=eq.${sessionId}` },
        (payload) => {
          const updated = payload.new as GameSession;
          if (updated.status === 'selecting' || updated.status === 'active') {
            supabase.removeChannel(channel);
            advance(updated);
          } else {
            setLocalSession(updated);
            setSession(updated);
          }
        },
      )
      .subscribe();

    // Polling fallback every 3 s — realtime can silently miss events for
    // registered (email/password) sessions due to JWT handling in the
    // Supabase realtime RLS evaluation path.
    const poll = setInterval(async () => {
      try {
        const s = await getSessionById(sessionId);
        if (!s) return;
        if (new Date(s.expires_at) < new Date() && s.status !== 'finished' && s.status !== 'abandoned') {
          clearInterval(poll);
          supabase.removeChannel(channel);
          setLoadError(true);
          return;
        }
        if (s.status === 'selecting' || s.status === 'active') {
          clearInterval(poll);
          supabase.removeChannel(channel);
          advance(s);
        }
      } catch {
        // transient error — next poll will retry
      }
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [sessionId]);

  // Loading timeout — show error if init hangs
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoadError(true), LOADING_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [loading]);

  const handleConfirmLeave = async () => {
    if (!sessionId) return;
    setLeaving(true);
    try {
      await abandonSession(sessionId);
      setConfirmLeaveVisible(false);
      router.replace('/(tabs)/home');
    } finally {
      setLeaving(false);
    }
  };

  if (loadError) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-6 gap-4">
        <Text className="text-navy text-lg font-bold text-center">Session unavailable</Text>
        <Text className="text-gray-500 text-sm text-center">
          This lobby is no longer available. Please start or join a new game.
        </Text>
        <Button title="Go Home" onPress={() => router.replace('/(tabs)/home')} />
      </SafeAreaView>
    );
  }

  if (loading || !session) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#7C3AED" />
      </SafeAreaView>
    );
  }

  const isHost = myRole === 'host';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScreenHeader title="Waiting Room" showBack={false} />
      <View className="flex-1 px-6 items-center justify-center gap-8">
        {isHost ? (
          <>
            <View className="items-center gap-2">
              <Text className="text-gray-500 text-sm">Share this code with your friend</Text>
              <JoinCodeDisplay code={session.join_code} />
            </View>

            <View className="flex-row items-center gap-3">
              <Animated.View style={dotStyle} className="w-3 h-3 rounded-full bg-amber-400" />
              <Text className="text-gray-500 text-sm">Waiting for opponent to join…</Text>
            </View>
          </>
        ) : (
          <View className="items-center gap-3">
            <CheckCircle2 size={40} color="#22C55E" strokeWidth={1.5} style={{ marginBottom: 8 }} />
            <Text className="text-navy text-xl font-bold">You&apos;re In!</Text>
            <View className="flex-row items-center gap-3">
              <Animated.View style={dotStyle} className="w-3 h-3 rounded-full bg-amber-400" />
              <Text className="text-gray-500 text-sm">Waiting for host to start…</Text>
            </View>
          </View>
        )}

        <Button title="Leave Game" variant="ghost" onPress={() => setConfirmLeaveVisible(true)} />
      </View>

      <ConfirmModal
        visible={confirmLeaveVisible}
        title="Leave Game?"
        message="Are you sure you want to leave the lobby?"
        confirmLabel="Leave Game"
        destructive
        loading={leaving}
        onConfirm={handleConfirmLeave}
        onCancel={() => setConfirmLeaveVisible(false)}
      />
    </SafeAreaView>
  );
}
