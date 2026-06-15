import React, { useEffect, useRef, useState } from 'react';
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
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { HelpCircle } from 'lucide-react-native';
import { CharacterGrid } from '../../src/components/game/CharacterGrid';
import { CharacterImage } from '../../src/components/game/CharacterImage';
import { TurnIndicator } from '../../src/components/game/TurnIndicator';
import { WinModal } from '../../src/components/game/WinModal';
import { OpponentLeftModal } from '../../src/components/game/OpponentLeftModal';
import { Button } from '../../src/components/ui/Button';
import { ConfirmModal } from '../../src/components/ui/ConfirmModal';
import { useGameStore } from '../../src/store/gameStore';
import { useRealtimeGame } from '../../src/hooks/useRealtimeGame';
import { getCharactersByIds } from '../../src/lib/packs';
import { getSessionById, endTurn, submitGuess, abandonSession } from '../../src/lib/session';
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
    seedMyEliminated,
    eliminateLocally,
    clearGame,
  } = useGameStore();

  const [loading, setLoading] = useState(true);
  const [endingTurn, setEndingTurn] = useState(false);
  const [guessModalVisible, setGuessModalVisible] = useState(false);
  const [guessSelected, setGuessSelected] = useState<Character | null>(null);
  const [submittingGuess, setSubmittingGuess] = useState(false);
  const [winVisible, setWinVisible] = useState(false);
  const [confirmLeaveVisible, setConfirmLeaveVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [opponentLeftVisible, setOpponentLeftVisible] = useState(false);
  const leftByMe = useRef(false);

  // Attach realtime
  useRealtimeGame(sessionId ?? null);

  useEffect(() => {
    if (!sessionId) return;
    const init = async () => {
      const s = await getSessionById(sessionId);
      if (!s) return;
      setSession(s);
      seedMyEliminated(s);
      const chars = await getCharactersByIds(s.character_pool);
      chars.sort(
        (a, b) => s.character_pool.indexOf(a.id) - s.character_pool.indexOf(b.id),
      );
      setCharacters(chars);
      setLoading(false);
    };
    init();
  }, [sessionId]);

  // Show win modal when game finishes, or opponent-left modal when abandoned by other player
  useEffect(() => {
    if (session?.status === 'finished') {
      setWinVisible(true);
    } else if (session?.status === 'abandoned' && !leftByMe.current) {
      setOpponentLeftVisible(true);
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
      await endTurn(sessionId, myRole, myEliminated, session?.turn_count ?? 0);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setEndingTurn(false);
    }
  };

  const handleConfirmLeave = async () => {
    if (!sessionId) return;
    setLeaving(true);
    leftByMe.current = true;
    try {
      await abandonSession(sessionId);
      setConfirmLeaveVisible(false);
      clearGame();
      router.replace('/(tabs)/home');
    } catch (e: any) {
      leftByMe.current = false;
      Alert.alert('Error', e.message);
    } finally {
      setLeaving(false);
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
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#7C3AED" />
      </SafeAreaView>
    );
  }

  const myCharId = myRole === 'host' ? session.host_character_id : session.guest_character_id;
  const opponentCharId = myRole === 'host' ? session.guest_character_id : session.host_character_id;
  const myCharacter = characters.find((c) => c.id === myCharId);
  const opponentCharacter = characters.find((c) => c.id === opponentCharId);

  const isMine = isMyTurn();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 pt-2 flex-row justify-end">
        <TouchableOpacity onPress={() => setConfirmLeaveVisible(true)} activeOpacity={0.7} hitSlop={8}>
          <Text style={{ color: '#EF4444', fontSize: 14, fontFamily: 'Poppins_500Medium' }}>Leave Game</Text>
        </TouchableOpacity>
      </View>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* My secret character */}
        <View className="px-4 pt-2 pb-2">
          {myCharacter && (
            <View className="flex-row items-center gap-3 bg-white rounded-2xl p-3 border border-gray-200 mb-3">
              <View className="relative">
                <CharacterImage
                  name={myCharacter.name}
                  imageUrl={myCharacter.image_url}
                  className="w-14 h-14 rounded-xl"
                  blurRadius={8}
                  initialsFontSize={22}
                />
                <View className="absolute inset-0 rounded-xl bg-black/25 items-center justify-center">
                  <HelpCircle size={24} color="white" strokeWidth={2} />
                </View>
              </View>
              <View>
                <Text className="text-gray-500 text-xs">You are…</Text>
                <Text className="text-navy font-bold text-sm">{myCharacter.name}</Text>
                <Text className="text-gray-400 text-xs">Don&apos;t show your opponent!</Text>
              </View>
            </View>
          )}

          <TurnIndicator isMyTurn={isMine} turnCount={session.turn_count} />
        </View>

        {/* Character grid */}
        <View className="px-1">
          <Text className="text-gray-400 text-xs font-medium uppercase tracking-wider px-3 mb-2">
            Your Board
          </Text>
          <CharacterGrid
            characters={characters}
            eliminated={myEliminated}
            onPress={isMine ? handleEliminate : undefined}
          />
        </View>

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
            <View className="bg-white rounded-2xl p-4 items-center border border-gray-200">
              <Text className="text-gray-400 text-sm">Waiting for opponent&apos;s turn…</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Guess Modal */}
      <Modal visible={guessModalVisible} animationType="slide">
        <SafeAreaProvider>
          <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom', 'left', 'right']}>
            <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
              <Text className="text-navy text-lg font-bold">Who is your opponent?</Text>
              <TouchableOpacity onPress={() => setGuessModalVisible(false)}>
                <Text className="text-gray-500 text-base">Cancel</Text>
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
        </SafeAreaProvider>
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

      {/* Confirm Leave Modal */}
      <ConfirmModal
        visible={confirmLeaveVisible}
        title="Leave Game?"
        message="If you leave now, the game will end for both players. This cannot be undone."
        confirmLabel="Leave Game"
        destructive
        loading={leaving}
        onConfirm={handleConfirmLeave}
        onCancel={() => setConfirmLeaveVisible(false)}
      />

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
