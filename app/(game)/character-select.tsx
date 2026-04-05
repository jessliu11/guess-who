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
import { Button } from '../../src/components/ui/Button';
import { getCharactersByIds } from '../../src/lib/packs';
import { setCharacter, getSessionById } from '../../src/lib/session';
import { useGameStore } from '../../src/store/gameStore';
import { supabase } from '../../src/lib/supabase';
import type { Character, GameSession } from '../../src/types/game.types';

export default function CharacterSelect() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { myRole, session, setSession, setCharacters } = useGameStore();

  const [characters, setLocalChars] = useState<Character[]>([]);
  const [selected, setSelected] = useState<Character | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    const init = async () => {
      const s = await getSessionById(sessionId);
      if (!s) return;
      setSession(s);
      const chars = await getCharactersByIds(s.character_pool);
      // Sort by pool order
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
            router.replace(`/(game)/board?sessionId=${sessionId}`);
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator color="#6471f1" />
      </SafeAreaView>
    );
  }

  const myCharField = myRole === 'host' ? session?.host_character_id : session?.guest_character_id;
  const hasConfirmed = !!myCharField;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScreenHeader title="Pick Your Character" showBack={false} />

      <ScrollView className="flex-1 px-2" showsVerticalScrollIndicator={false}>
        <Text className="text-slate-400 text-sm text-center px-4 mb-4">
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
            <Text className="text-green-400 font-semibold">✓ Character selected</Text>
            <Text className="text-slate-500 text-xs">Waiting for opponent…</Text>
          </View>
        )}
      </ScrollView>

      {/* Confirm modal */}
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/70 items-center justify-center px-8">
          <View className="bg-surface-card rounded-3xl p-6 w-full items-center border border-slate-700">
            <Text className="text-white text-lg font-bold mb-2">Confirm Character</Text>
            {selected && (
              <>
                <Image
                  source={{ uri: selected.image_url }}
                  className="w-28 h-28 rounded-2xl my-3"
                  resizeMode="cover"
                />
                <Text className="text-white font-semibold text-base mb-1">{selected.name}</Text>
                <Text className="text-slate-400 text-xs text-center mb-5">
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
    </SafeAreaView>
  );
}
