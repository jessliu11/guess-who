import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { Button } from '../../src/components/ui/Button';
import { JoinCodeInput } from '../../src/components/ui/JoinCodeInput';
import { useAuth } from '../../src/hooks/useAuth';
import { useSubscription } from '../../src/hooks/useSubscription';
import { getSystemPacks, getCharactersByIds } from '../../src/lib/packs';
import { createSession, joinSession } from '../../src/lib/session';
import { useGameStore } from '../../src/store/gameStore';
import type { CharacterPack, Character } from '../../src/types/game.types';

const MIN_CHARACTERS = 4;

// ---- Sub-components ----

function CharacterCard({
  character,
  selected,
  onToggle,
}: {
  character: Character;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.7}
      style={{ width: '23%', margin: '1%' }}
    >
      <View
        className={`rounded-xl overflow-hidden border-2 ${
          selected ? 'border-primary-500' : 'border-slate-700'
        }`}
      >
        <Image
          source={{ uri: character.image_url }}
          style={{ width: '100%', aspectRatio: 1 }}
          resizeMode="cover"
        />
        {selected && (
          <View className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary-500 items-center justify-center">
            <Text className="text-white text-[10px] font-bold">✓</Text>
          </View>
        )}
        <View className="bg-surface-card px-1 py-1">
          <Text className="text-white text-[10px] text-center" numberOfLines={1}>
            {character.name}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function PackSection({
  pack,
  isExpanded,
  isLocked,
  characters,
  loadingChars,
  selectedIds,
  onToggleExpand,
  onToggleCharacter,
  onSelectAll,
  onDeselectAll,
}: {
  pack: CharacterPack;
  isExpanded: boolean;
  isLocked: boolean;
  characters: Character[];
  loadingChars: boolean;
  selectedIds: Set<string>;
  onToggleExpand: () => void;
  onToggleCharacter: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}) {
  const selectedInPack = characters.filter((c) => selectedIds.has(c.id)).length;
  const allSelected = characters.length > 0 && selectedInPack === characters.length;

  return (
    <View className="mb-3 rounded-2xl border border-slate-700 bg-surface-card overflow-hidden">
      {/* Pack header */}
      <TouchableOpacity
        onPress={onToggleExpand}
        activeOpacity={0.7}
        className="px-4 py-3 flex-row items-center justify-between"
      >
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className={`font-semibold text-base ${isLocked ? 'text-slate-400' : 'text-white'}`}>
              {pack.name}
            </Text>
            {isLocked && <Text className="text-slate-500 text-xs">🔒 Pro</Text>}
          </View>
          <Text className="text-slate-500 text-xs mt-0.5">
            {pack.character_ids.length} characters
            {isExpanded && selectedInPack > 0 && ` · ${selectedInPack} selected`}
          </Text>
        </View>
        <Text className="text-slate-400 text-lg">{isExpanded ? '▾' : '▸'}</Text>
      </TouchableOpacity>

      {/* Expanded character grid */}
      {isExpanded && (
        <View className="px-2 pb-3 border-t border-slate-700">
          {/* Select all / deselect all */}
          <View className="flex-row gap-2 px-2 pt-3 pb-2">
            <TouchableOpacity
              onPress={onSelectAll}
              disabled={allSelected}
              className={`flex-1 py-1.5 rounded-lg items-center border ${
                allSelected ? 'border-slate-700 opacity-40' : 'border-primary-600'
              }`}
            >
              <Text className="text-primary-400 text-xs font-medium">Select All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onDeselectAll}
              disabled={selectedInPack === 0}
              className={`flex-1 py-1.5 rounded-lg items-center border ${
                selectedInPack === 0 ? 'border-slate-700 opacity-40' : 'border-slate-600'
              }`}
            >
              <Text className="text-slate-400 text-xs font-medium">Deselect All</Text>
            </TouchableOpacity>
          </View>

          {loadingChars ? (
            <ActivityIndicator color="#6471f1" className="my-4" />
          ) : (
            <View className="flex-row flex-wrap">
              {characters.map((character) => (
                <CharacterCard
                  key={character.id}
                  character={character}
                  selected={selectedIds.has(character.id)}
                  onToggle={() => onToggleCharacter(character.id)}
                />
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ---- Main screen ----

export default function Setup() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode: 'host' | 'join' }>();
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const clearGame = useGameStore((s) => s.clearGame);

  const isHost = mode !== 'join';

  const [packs, setPacks] = useState<CharacterPack[]>([]);
  const [expandedPackIds, setExpandedPackIds] = useState<Set<string>>(new Set());
  const [packCharacters, setPackCharacters] = useState<Record<string, Character[]>>({});
  const [loadingCharacters, setLoadingCharacters] = useState<Record<string, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPacks, setLoadingPacks] = useState(isHost);

  useEffect(() => {
    clearGame();
    if (isHost) {
      getSystemPacks()
        .then(setPacks)
        .finally(() => setLoadingPacks(false));
    }
  }, [isHost]);

  const togglePackExpansion = async (pack: CharacterPack) => {
    const isExpanded = expandedPackIds.has(pack.id);
    if (isExpanded) {
      setExpandedPackIds((prev) => {
        const s = new Set(prev);
        s.delete(pack.id);
        return s;
      });
    } else {
      setExpandedPackIds((prev) => new Set([...prev, pack.id]));
      if (!packCharacters[pack.id]) {
        setLoadingCharacters((prev) => ({ ...prev, [pack.id]: true }));
        try {
          const chars = await getCharactersByIds(pack.character_ids);
          setPackCharacters((prev) => ({ ...prev, [pack.id]: chars }));
        } finally {
          setLoadingCharacters((prev) => ({ ...prev, [pack.id]: false }));
        }
      }
    }
  };

  const toggleCharacter = (id: string) => {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  const selectAllFromPack = (pack: CharacterPack) => {
    const chars = packCharacters[pack.id] ?? [];
    setSelectedIds((prev) => {
      const s = new Set(prev);
      chars.forEach((c) => s.add(c.id));
      return s;
    });
  };

  const deselectAllFromPack = (pack: CharacterPack) => {
    const chars = packCharacters[pack.id] ?? [];
    setSelectedIds((prev) => {
      const s = new Set(prev);
      chars.forEach((c) => s.delete(c.id));
      return s;
    });
  };

  const handleHostStart = async () => {
    if (!user || selectedIds.size < MIN_CHARACTERS) return;
    setLoading(true);
    try {
      const session = await createSession(user.id, null, Array.from(selectedIds));
      useGameStore.getState().setMyRole('host');
      router.push(`/(game)/lobby?sessionId=${session.id}`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user) return;
    const code = joinCode.trim();
    if (code.length < 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-character game code.');
      return;
    }
    setLoading(true);
    try {
      const session = await joinSession(user.id, code);
      useGameStore.getState().setMyRole('guest');
      router.push(`/(game)/lobby?sessionId=${session.id}`);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not find that game.');
    } finally {
      setLoading(false);
    }
  };

  // ---- HOST VIEW ----
  if (isHost) {
    if (loadingPacks) {
      return (
        <SafeAreaView className="flex-1 bg-surface items-center justify-center">
          <ActivityIndicator color="#6471f1" />
        </SafeAreaView>
      );
    }

    const standardPacks = packs.filter((p) => !p.requires_premium);
    const extendedPacks = packs.filter((p) => p.requires_premium);
    const selectedCount = selectedIds.size;
    const canStart = selectedCount >= MIN_CHARACTERS;

    return (
      <SafeAreaView className="flex-1 bg-surface">
        <ScreenHeader title="Choose Characters" />
        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          <Text className="text-slate-400 text-sm mb-4">
            Expand a pack to pick characters. Mix and match from any pack.
          </Text>

          <Text className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">
            Standard — Free
          </Text>
          {standardPacks.map((pack) => (
            <PackSection
              key={pack.id}
              pack={pack}
              isExpanded={expandedPackIds.has(pack.id)}
              isLocked={false}
              characters={packCharacters[pack.id] ?? []}
              loadingChars={loadingCharacters[pack.id] ?? false}
              selectedIds={selectedIds}
              onToggleExpand={() => togglePackExpansion(pack)}
              onToggleCharacter={toggleCharacter}
              onSelectAll={() => selectAllFromPack(pack)}
              onDeselectAll={() => deselectAllFromPack(pack)}
            />
          ))}

          {extendedPacks.length > 0 && (
            <>
              <Text className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3 mt-2">
                Extended — Pro
              </Text>
              {extendedPacks.map((pack) => (
                <PackSection
                  key={pack.id}
                  pack={pack}
                  isExpanded={expandedPackIds.has(pack.id)}
                  isLocked={!isPremium}
                  characters={packCharacters[pack.id] ?? []}
                  loadingChars={loadingCharacters[pack.id] ?? false}
                  selectedIds={selectedIds}
                  onToggleExpand={() => {
                    if (!isPremium) { router.push('/paywall'); return; }
                    togglePackExpansion(pack);
                  }}
                  onToggleCharacter={toggleCharacter}
                  onSelectAll={() => selectAllFromPack(pack)}
                  onDeselectAll={() => deselectAllFromPack(pack)}
                />
              ))}
            </>
          )}

          <View className="mt-4 mb-8">
            <Text
              className={`text-center text-sm mb-3 ${canStart ? 'text-slate-300' : 'text-slate-500'}`}
            >
              {selectedCount} character{selectedCount !== 1 ? 's' : ''} selected
              {!canStart && ` — select at least ${MIN_CHARACTERS} to start`}
            </Text>
            <Button
              title="Create Game"
              size="lg"
              loading={loading}
              disabled={!canStart}
              onPress={handleHostStart}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---- GUEST VIEW ----
  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScreenHeader title="Join a Game" />
      <View className="flex-1 px-6 pt-8 gap-6">
        <View className="items-center">
          <Text className="text-slate-400 text-sm mb-6 text-center">
            Enter the 6-character code from your friend
          </Text>
          <JoinCodeInput value={joinCode} onChange={setJoinCode} />
        </View>
        <Button
          title="Join Game"
          size="lg"
          loading={loading}
          disabled={joinCode.length < 6}
          onPress={handleJoin}
          className="mt-4"
        />
      </View>
    </SafeAreaView>
  );
}
