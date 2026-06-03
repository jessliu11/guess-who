import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { CharacterCard } from '../../src/components/game/CharacterCard';
import { CharacterImage } from '../../src/components/game/CharacterImage';
import { OpponentLeftModal } from '../../src/components/game/OpponentLeftModal';
import { Button } from '../../src/components/ui/Button';
import { getCharactersByIds } from '../../src/lib/packs';
import { setCharacter, getSessionById } from '../../src/lib/session';
import { useGameStore } from '../../src/store/gameStore';
import { supabase } from '../../src/lib/supabase';
import type { Character, GameSession } from '../../src/types/game.types';

export default function CharacterSelect() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { myRole, session, setSession, setCharacters, clearGame } = useGameStore();

  const [characters, setLocalChars] = useState<Character[]>([]);
  const [selected, setSelected] = useState<Character | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [opponentLeftVisible, setOpponentLeftVisible] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    let didNavigate = false;
    const goToBoard = () => {
      if (didNavigate) return;
      didNavigate = true;
      router.replace(`/(game)/board?sessionId=${sessionId}`);
    };

    const init = async () => {
      const s = await getSessionById(sessionId);
      if (!s) return;
      setSession(s);
      if (s.status === 'active') { goToBoard(); return; }
      const chars = await getCharactersByIds(s.character_pool);
      const poolOrder = s.character_pool;
      chars.sort((a, b) => poolOrder.indexOf(a.id) - poolOrder.indexOf(b.id));
      setLocalChars(chars);
      setCharacters(chars);
      setLoading(false);
    };
    init();

    // Watch for both characters selected → navigate to board
    const channel = supabase
      .channel(`select:${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_sessions', filter: `id=eq.${sessionId}` },
        (payload) => {
          const updated = payload.new as GameSession;
          setSession(updated);
          if (updated.status === 'active') {
            supabase.removeChannel(channel);
            goToBoard();
          } else if (updated.status === 'abandoned') {
            setOpponentLeftVisible(true);
          }
        },
      )
      .subscribe();

    // Polling fallback — same realtime issue as lobby for registered users
    const poll = setInterval(async () => {
      const s = await getSessionById(sessionId);
      if (s) setSession(s);
      if (s?.status === 'active') {
        clearInterval(poll);
        supabase.removeChannel(channel);
        goToBoard();
      } else if (s?.status === 'abandoned') {
        setOpponentLeftVisible(true);
      }
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [sessionId]);

  const handleConfirm = async () => {
    if (!selected || !sessionId || !myRole) return;
    setConfirming(true);
    try {
      await setCharacter(sessionId, myRole, selected.id);
      setConfirmVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#7C3AED" />
      </SafeAreaView>
    );
  }

  const myCharField = myRole === 'host' ? session?.host_character_id : session?.guest_character_id;
  const hasConfirmed = !!myCharField;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScreenHeader title="Pick Your Character" showBack={false} />

      <ScrollView className="flex-1 px-2" showsVerticalScrollIndicator={false}>
        <Text className="text-gray-500 text-sm text-center px-4 mb-4">
          {hasConfirmed
            ? 'Waiting for your opponent to pick…'
            : 'Tap a character to select them as your secret identity'}
        </Text>

        <View className="flex-row flex-wrap justify-center">
          {characters.map((char) => (
            <CharacterCard
              key={char.id}
              character={char}
              selected={selected?.id === char.id}
              onPress={hasConfirmed ? undefined : () => setSelected(char)}
            />
          ))}
        </View>

        {!hasConfirmed && selected && (
          <View className="px-4 mt-4 mb-8">
            <Button
              title={`Choose ${selected.name}`}
              size="lg"
              onPress={() => setConfirmVisible(true)}
            />
          </View>
        )}
        {hasConfirmed && (
          <View className="items-center mt-4 mb-8 gap-2">
            <Text className="text-green-600 font-semibold">✓ Character selected</Text>
            <Text className="text-gray-400 text-xs">Waiting for opponent…</Text>
          </View>
        )}
      </ScrollView>

      {/* Confirm modal */}
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center px-8">
          <View className="bg-white rounded-3xl p-6 w-full items-center border border-gray-200">
            <Text className="text-navy text-lg font-bold mb-2">Confirm Character</Text>
            {selected && (
              <>
                <CharacterImage
                  name={selected.name}
                  imageUrl={selected.image_url}
                  className="w-28 h-28 rounded-2xl my-3"
                  initialsFontSize={42}
                />
                <Text className="text-navy font-semibold text-base mb-1">{selected.name}</Text>
                <Text className="text-gray-500 text-xs text-center mb-5">
                  Once confirmed, your opponent will try to guess this character.
                </Text>
              </>
            )}
            <View className="w-full gap-3">
              <Button title="Confirm" loading={confirming} onPress={handleConfirm} />
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setConfirmVisible(false)}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Opponent Left Modal */}
      <OpponentLeftModal
        visible={opponentLeftVisible}
        onHome={() => {
          setOpponentLeftVisible(false);
          clearGame();
          router.replace('/(tabs)/home');
        }}
      />
    </SafeAreaView>
  );
}
