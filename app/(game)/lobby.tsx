import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { JoinCodeDisplay } from '../../src/components/ui/JoinCodeDisplay';
import { Button } from '../../src/components/ui/Button';
import { getSessionById, abandonSession } from '../../src/lib/session';
import { useGameStore } from '../../src/store/gameStore';
import { supabase } from '../../src/lib/supabase';
import type { GameSession } from '../../src/types/game.types';

export default function Lobby() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const myRole = useGameStore((s) => s.myRole);
  const setSession = useGameStore((s) => s.setSession);

  const [session, setLocalSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);

  const dotScale = useSharedValue(1);
  const dotStyle = useAnimatedStyle(() => ({ transform: [{ scale: dotScale.value }] }));

  useEffect(() => {
    dotScale.value = withRepeat(withTiming(1.3, { duration: 700 }), -1, true);
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    // Initial load
    getSessionById(sessionId).then((s) => {
      if (s) { setLocalSession(s); setSession(s); }
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
          setLocalSession(updated);
          setSession(updated);

          if (updated.status === 'selecting') {
            supabase.removeChannel(channel);
            router.replace(`/(game)/character-select?sessionId=${sessionId}`);
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  const handleCancel = async () => {
    if (!sessionId) return;
    await abandonSession(sessionId);
    router.replace('/(tabs)/home');
  };

  if (loading || !session) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator color="#6471f1" />
      </SafeAreaView>
    );
  }

  const isHost = myRole === 'host';

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScreenHeader title="Waiting Room" showBack={false} />
      <View className="flex-1 px-6 items-center justify-center gap-8">
        {isHost ? (
          <>
            <View className="items-center gap-2">
              <Text className="text-slate-400 text-sm">Share this code with your friend</Text>
              <JoinCodeDisplay code={session.join_code} />
            </View>

            <View className="flex-row items-center gap-3">
              <Animated.View style={dotStyle} className="w-3 h-3 rounded-full bg-amber-400" />
              <Text className="text-slate-400 text-sm">Waiting for opponent to join…</Text>
            </View>
          </>
        ) : (
          <View className="items-center gap-3">
            <Text className="text-4xl mb-2">✅</Text>
            <Text className="text-white text-xl font-bold">You're In!</Text>
            <View className="flex-row items-center gap-3">
              <Animated.View style={dotStyle} className="w-3 h-3 rounded-full bg-amber-400" />
              <Text className="text-slate-400 text-sm">Waiting for host to start…</Text>
            </View>
          </View>
        )}

        <Button title="Leave Game" variant="ghost" onPress={handleCancel} />
      </View>
    </SafeAreaView>
  );
}
