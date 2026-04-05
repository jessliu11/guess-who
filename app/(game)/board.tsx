import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { CharacterGrid } from '../../src/components/game/CharacterGrid';
import { TurnIndicator } from '../../src/components/game/TurnIndicator';
import { WinModal } from '../../src/components/game/WinModal';
import { Button } from '../../src/components/ui/Button';
import { useGameStore } from '../../src/store/gameStore';
import { useRealtimeGame } from '../../src/hooks/useRealtimeGame';
import { getCharactersByIds } from '../../src/lib/packs';
import { getSessionById, endTurn, submitGuess } from '../../src/lib/session';
import type { Character, GameSession } from '../../src/types/game.types';

export default function Board() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const {
    session,
    characters,
    myRole,
    myEliminated,
    isMyTurn,
    setSession,
    setCharacters,
    eliminateLocally,
    clearGame,
  } = useGameStore();

  const [loading, setLoading] = useState(true);
  const [endingTurn, setEndingTurn] = useState(false);
  const [guessModalVisible, setGuessModalVisible] = useState(false);
  const [guessSelected, setGuessSelected] = useState<Character | null>(null);
  const [submittingGuess, setSubmittingGuess] = useState(false);
  const [winVisible, setWinVisible] = useState(false);

  // Attach realtime
  useRealtimeGame(sessionId ?? null);

  useEffect(() => {
    if (!sessionId) return;
    const init = async () => {
      const s = await getSessionById(sessionId);
      if (!s) return;
      setSession(s);
      const chars = await getCharactersByIds(s.character_pool);
      chars.sort(
        (a, b) => s.character_pool.indexOf(a.id) - s.character_pool.indexOf(b.id),
      );
      setCharacters(chars);
      setLoading(false);
    };
    init();
  }, [sessionId]);

  // Show win modal when game finishes
  useEffect(() => {
    if (session?.status === 'finished') {
      setWinVisible(true);
    }
  }, [session?.status]);

  const handleEliminate = (char: Character) => {
    if (!isMyTurn()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    eliminateLocally(char.id);
  };

  const handleEndTurn = async () => {
    if (!sessionId || !myRole) return;
    setEndingTurn(true);
    try {
      await endTurn(sessionId, myRole, myEliminated);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setEndingTurn(false);
    }
  };

  const handleSubmitGuess = async () => {
    if (!guessSelected || !sessionId || !myRole) return;
    setSubmittingGuess(true);
    try {
      const updated = await submitGuess(sessionId, myRole, guessSelected.id);
      setSession(updated as unknown as GameSession);
      setGuessModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmittingGuess(false);
    }
  };

  if (loading || !session) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator color="#6471f1" />
      </SafeAreaView>
    );
  }

  const myCharId = myRole === 'host' ? session.host_character_id : session.guest_character_id;
  const opponentCharId = myRole === 'host' ? session.guest_character_id : session.host_character_id;
  const myCharacter = characters.find((c) => c.id === myCharId);
  const opponentCharacter = characters.find((c) => c.id === opponentCharId);

  // Opponent's eliminated (what we see flipped on their board)
  const opponentEliminated =
    myRole === 'host' ? session.guest_eliminated : session.host_eliminated;

  const isMine = isMyTurn();

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* My secret character */}
        <View className="px-4 pt-3 pb-2">
          {myCharacter && (
            <View className="flex-row items-center gap-3 bg-surface-card rounded-2xl p-3 border border-slate-700 mb-3">
              <View className="relative">
                <Image
                  source={{ uri: myCharacter.image_url }}
                  className="w-14 h-14 rounded-xl"
                  blurRadius={8}
                  resizeMode="cover"
                />
                <View className="absolute inset-0 rounded-xl bg-black/40 items-center justify-center">
                  <Text className="text-white text-xs">🤫</Text>
                </View>
              </View>
              <View>
                <Text className="text-slate-400 text-xs">You are…</Text>
                <Text className="text-white font-bold text-sm">{myCharacter.name}</Text>
                <Text className="text-slate-500 text-xs">Don't show your opponent!</Text>
              </View>
            </View>
          )}

          <TurnIndicator isMyTurn={isMine} turnCount={session.turn_count} />
        </View>

        {/* Character grid */}
        <View className="px-1">
          <Text className="text-slate-400 text-xs font-medium uppercase tracking-wider px-3 mb-2">
            Your Board
          </Text>
          <CharacterGrid
            characters={characters}
            eliminated={myEliminated}
            onPress={isMine ? handleEliminate : undefined}
          />
        </View>

        {/* Opponent's eliminated (read-only reference) */}
        {opponentEliminated.length > 0 && (
          <View className="px-1 mt-4">
            <Text className="text-slate-500 text-xs font-medium uppercase tracking-wider px-3 mb-2">
              Opponent eliminated ({opponentEliminated.length})
            </Text>
            <CharacterGrid
              characters={characters}
              eliminated={opponentEliminated}
            />
          </View>
        )}

        {/* Actions */}
        {isMine && (
          <View className="px-4 mt-4 gap-3 pb-8">
            <Button
              title={`End Turn (${myEliminated.length} eliminated)`}
              variant="secondary"
              loading={endingTurn}
              onPress={handleEndTurn}
            />
            <Button
              title="Make a Guess"
              onPress={() => { setGuessSelected(null); setGuessModalVisible(true); }}
            />
          </View>
        )}
        {!isMine && (
          <View className="px-4 mt-4 pb-8">
            <View className="bg-surface-card rounded-2xl p-4 items-center border border-slate-700">
              <Text className="text-slate-400 text-sm">Waiting for opponent's turn…</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Guess Modal */}
      <Modal visible={guessModalVisible} animationType="slide">
        <SafeAreaView className="flex-1 bg-surface">
          <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
            <Text className="text-white text-lg font-bold">Who is your opponent?</Text>
            <TouchableOpacity onPress={() => setGuessModalVisible(false)}>
              <Text className="text-slate-400 text-base">Cancel</Text>
            </TouchableOpacity>
          </View>
          <ScrollView className="flex-1 px-1">
            <CharacterGrid
              characters={characters}
              eliminated={[]}
              selectedId={guessSelected?.id}
              onPress={setGuessSelected}
            />
          </ScrollView>
          <View className="px-4 pb-6 pt-3">
            <Button
              title={guessSelected ? `Guess ${guessSelected.name}` : 'Select a character'}
              disabled={!guessSelected}
              loading={submittingGuess}
              onPress={handleSubmitGuess}
              size="lg"
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Win Modal */}
      <WinModal
        visible={winVisible}
        winner={session.winner}
        myRole={myRole ?? 'guest'}
        opponentCharacter={opponentCharacter}
        onPlayAgain={() => {
          clearGame();
          router.replace('/(game)/setup?mode=host');
        }}
        onHome={() => {
          clearGame();
          router.replace('/(tabs)/home');
        }}
      />
    </SafeAreaView>
  );
}
