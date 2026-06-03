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
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/ui/Button';
import { CharacterImage } from '../../src/components/game/CharacterImage';
import { JoinCodeInput } from '../../src/components/ui/JoinCodeInput';
import { useAuth } from '../../src/hooks/useAuth';
import { useSubscription } from '../../src/hooks/useSubscription';
import { FREE_CATEGORY_IDS } from '../../src/constants/config';
import { getSystemPacks, getCharactersByIds } from '../../src/lib/packs';
import { getMyCustomCharacters } from '../../src/lib/characters';
import { createSession, joinSession } from '../../src/lib/session';
import { useGameStore } from '../../src/store/gameStore';
import type { CharacterPack, Character } from '../../src/types/game.types';

const MIN_CHARACTERS = 4;
const BOARD_SIZE_PRESETS = [4, 9, 12, 16, 24, 32, 36];

function displayPackName(name: string) {
  return name.replace(/\s*[-–—]+\s*(Standard|Extended)\s*$/i, '').trim();
}
const PACK_BORDER_COLORS = ['#7C3AED', '#F59E0B', '#14B8A6', '#EC4899', '#3B82F6', '#10B981'];

function SetupCharacterCard({
  character,
  selected,
  onToggle,
  borderColor,
}: {
  character: Character;
  selected: boolean;
  onToggle: () => void;
  borderColor: string;
}) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.7}
      style={{ width: '23%', margin: '1%' }}
    >
      <View
        className="rounded-xl overflow-hidden"
        style={{ borderWidth: 2, borderColor: selected ? borderColor : '#E5E0D5' }}
      >
        <CharacterImage
          name={character.name}
          imageUrl={character.image_url}
          style={{ width: '100%', aspectRatio: 1 }}
          initialsFontSize={26}
        />
        {selected && (
          <View
            className="absolute top-1 right-1 w-5 h-5 rounded-full items-center justify-center"
            style={{ backgroundColor: borderColor }}
          >
            <Text className="text-white text-[10px] font-bold">✓</Text>
          </View>
        )}
        <View className="bg-gray-50 px-1 py-1">
          <Text className="text-navy text-[10px] text-center" numberOfLines={1}>
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
  packColor,
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
  packColor: string;
}) {
  const selectedInPack = characters.filter((c) => selectedIds.has(c.id)).length;
  const imgUrl = pack.preview_image_urls?.[0];

  return (
    <View className="mb-2 rounded-2xl bg-white border border-gray-200 overflow-hidden">
      <TouchableOpacity
        onPress={onToggleExpand}
        activeOpacity={0.7}
        className="px-4 py-3.5 flex-row items-center"
      >
        {/* Pack icon */}
        <View className="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 items-center justify-center mr-3">
          {imgUrl ? (
            <Image source={{ uri: imgUrl }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <Text className="text-xl">🎴</Text>
          )}
        </View>

        <View className="flex-1">
          <Text className={`font-semibold text-sm ${isLocked ? 'text-gray-400' : 'text-navy'}`}>
            {displayPackName(pack.name)}
          </Text>
          <Text className="text-gray-400 text-xs mt-0.5">
            {isExpanded && selectedInPack > 0
              ? `${selectedInPack} of ${pack.character_ids.length} selected`
              : `${pack.character_ids.length} characters`}
          </Text>
        </View>

        <View className="flex-row items-center gap-3">
          {!isLocked && isExpanded && (
            <TouchableOpacity
              onPress={selectedInPack > 0 ? onDeselectAll : onSelectAll}
              className="px-3 py-1.5 rounded-full"
              style={{ backgroundColor: '#F0EDE8' }}
            >
              <Text className="text-gray-600 text-xs font-medium">
                {selectedInPack > 0 ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          )}
          {isLocked ? (
            <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" />
          ) : (
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#9CA3AF"
            />
          )}
        </View>
      </TouchableOpacity>

      {isExpanded && !isLocked && (
        <View className="border-t border-gray-200 px-2 pb-3 pt-2">
          {loadingChars ? (
            <ActivityIndicator color="#7C3AED" className="my-4" />
          ) : (
            <View className="flex-row flex-wrap">
              {characters.map((character) => (
                <SetupCharacterCard
                  key={character.id}
                  character={character}
                  selected={selectedIds.has(character.id)}
                  onToggle={() => onToggleCharacter(character.id)}
                  borderColor={packColor}
                />
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default function Setup() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode: 'host' | 'join' }>();
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const clearGame = useGameStore((s) => s.clearGame);

  const isHost = mode !== 'join';

  const [packs, setPacks] = useState<CharacterPack[]>([]);
  const [customCharacters, setCustomCharacters] = useState<Character[]>([]);
  const [customExpanded, setCustomExpanded] = useState(false);
  const [expandedPackIds, setExpandedPackIds] = useState<Set<string>>(new Set());
  const [packCharacters, setPackCharacters] = useState<Record<string, Character[]>>({});
  const [loadingCharacters, setLoadingCharacters] = useState<Record<string, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [boardSize, setBoardSize] = useState(9);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPacks, setLoadingPacks] = useState(isHost);

  useEffect(() => {
    clearGame();
    if (isHost) {
      Promise.all([
        getSystemPacks(),
        user ? getMyCustomCharacters(user.id) : Promise.resolve([]),
      ]).then(([sp, cc]) => {
        setPacks(sp);
        setCustomCharacters(cc);
      }).finally(() => setLoadingPacks(false));
    }
  }, [isHost, user]);

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

  const selectAllCustom = () => {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      customCharacters.forEach((c) => s.add(c.id));
      return s;
    });
  };

  const deselectAllCustom = () => {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      customCharacters.forEach((c) => s.delete(c.id));
      return s;
    });
  };

  const handleHostStart = async () => {
    if (!user || selectedIds.size < MIN_CHARACTERS) return;
    setLoading(true);
    try {
      const session = await createSession(user.id, null, Array.from(selectedIds), boardSize);
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
        <SafeAreaView className="flex-1 bg-background items-center justify-center">
          <ActivityIndicator color="#7C3AED" />
        </SafeAreaView>
      );
    }

    const isFreePack = (p: CharacterPack) =>
      FREE_CATEGORY_IDS.includes(p.category_id ?? '');
    const standardPacks = packs
      .filter((p) => !p.requires_premium)
      .sort((a, b) => {
        const aFree = isFreePack(a);
        const bFree = isFreePack(b);
        if (aFree && !bFree) return -1;
        if (!aFree && bFree) return 1;
        return 0;
      });
    const extendedPacks = packs.filter((p) => p.requires_premium);
    const selectedCount = selectedIds.size;
    const canStart = selectedCount >= MIN_CHARACTERS;

    return (
      <SafeAreaView className="flex-1 bg-background">
        {/* Header */}
        <View className="px-4 pt-4 pb-2 flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-white border border-gray-200 items-center justify-center"
            activeOpacity={0.7}
          >
            <Text className="text-navy text-base leading-none">‹</Text>
          </TouchableOpacity>
          <View>
            <Text className="text-navy text-xl font-bold">Host Game</Text>
            <Text className="text-gray-400 text-xs">Select characters for the board</Text>
          </View>
        </View>

        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          {/* My Characters */}
          {customCharacters.length > 0 && (
            <View className="mb-2 rounded-2xl bg-white border border-gray-200 overflow-hidden">
              <TouchableOpacity
                onPress={() => setCustomExpanded((v) => !v)}
                activeOpacity={0.7}
                className="px-4 py-3.5 flex-row items-center"
              >
                <View className="w-11 h-11 rounded-xl bg-primary-100 items-center justify-center mr-3">
                  <Text className="text-xl">🎨</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-navy font-semibold text-sm">My Characters</Text>
                  <Text className="text-gray-400 text-xs mt-0.5">
                    {customExpanded && customCharacters.filter((c) => selectedIds.has(c.id)).length > 0
                      ? `${customCharacters.filter((c) => selectedIds.has(c.id)).length} of ${customCharacters.length} selected`
                      : `${customCharacters.length} characters`}
                  </Text>
                </View>
                <View className="flex-row items-center gap-3">
                  {customExpanded && (
                    <TouchableOpacity
                      onPress={customCharacters.some((c) => selectedIds.has(c.id)) ? deselectAllCustom : selectAllCustom}
                      className="px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: '#F0EDE8' }}
                    >
                      <Text className="text-gray-600 text-xs font-medium">
                        {customCharacters.some((c) => selectedIds.has(c.id)) ? 'Deselect All' : 'Select All'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <Ionicons
                    name={customExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#9CA3AF"
                  />
                </View>
              </TouchableOpacity>

              {customExpanded && (
                <View className="border-t border-gray-200 px-2 pb-3 pt-2">
                  <View className="flex-row flex-wrap">
                    {customCharacters.map((character) => (
                      <SetupCharacterCard
                        key={character.id}
                        character={character}
                        selected={selectedIds.has(character.id)}
                        onToggle={() => toggleCharacter(character.id)}
                        borderColor="#7C3AED"
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {standardPacks.map((pack, i) => {
            const isLocked = !isPremium && !isFreePack(pack);
            return (
              <PackSection
                key={pack.id}
                pack={pack}
                isExpanded={expandedPackIds.has(pack.id)}
                isLocked={isLocked}
                characters={packCharacters[pack.id] ?? []}
                loadingChars={loadingCharacters[pack.id] ?? false}
                selectedIds={selectedIds}
                onToggleExpand={() => {
                  if (isLocked) { router.push('/paywall'); return; }
                  togglePackExpansion(pack);
                }}
                onToggleCharacter={toggleCharacter}
                onSelectAll={() => selectAllFromPack(pack)}
                onDeselectAll={() => deselectAllFromPack(pack)}
                packColor={PACK_BORDER_COLORS[i % PACK_BORDER_COLORS.length]}
              />
            );
          })}

          {extendedPacks.length > 0 && extendedPacks.map((pack, i) => (
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
              packColor={PACK_BORDER_COLORS[(standardPacks.length + i) % PACK_BORDER_COLORS.length]}
            />
          ))}

          {/* Spacer for sticky footer */}
          <View className="h-32" />
        </ScrollView>

        {/* Sticky footer */}
        <View className="bg-background border-t border-gray-200 px-4 pt-3 pb-4">
          {/* Board size presets */}
          <View className="mb-3">
            <Text className="text-gray-500 text-xs mb-2">Board size</Text>
            <View className="flex-row flex-wrap gap-2">
              {BOARD_SIZE_PRESETS.map((size) => {
                const isAvailable = size <= selectedCount;
                const isActive = boardSize === size;
                return (
                  <TouchableOpacity
                    key={size}
                    onPress={() => { if (isAvailable) setBoardSize(size); }}
                    disabled={!isAvailable}
                    className="w-10 h-10 rounded-2xl items-center justify-center"
                    style={{
                      backgroundColor: isActive ? '#7C3AED' : isAvailable ? '#F0EDE8' : '#F5F3F0',
                    }}
                  >
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: isActive ? 'white' : isAvailable ? '#1E1B4B' : '#C4C0BA' }}
                    >
                      {size}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-navy font-bold text-base">{selectedCount} selected</Text>
              <Text className="text-gray-400 text-xs">
                {canStart
                  ? boardSize < selectedCount
                    ? `${boardSize} will be drawn from your ${selectedCount}`
                    : 'Ready to go!'
                  : `Min ${MIN_CHARACTERS} to play`}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleHostStart}
              disabled={!canStart || loading}
              className="flex-row items-center gap-2 px-6 py-3.5 rounded-2xl"
              style={{ backgroundColor: canStart ? '#7C3AED' : '#C4B5FD' }}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="arrow-forward" size={18} color="white" />
                  <Text className="text-white font-semibold text-base">Create Game</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ---- GUEST / JOIN VIEW ----
  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-4 pb-2 flex-row items-center gap-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-white border border-gray-200 items-center justify-center"
          activeOpacity={0.7}
        >
          <Text className="text-navy text-base leading-none">‹</Text>
        </TouchableOpacity>
        <Text className="text-navy text-xl font-bold">Join Game</Text>
      </View>

      <View className="flex-1 px-6 pt-8 items-center">
        {/* Hero icon */}
        <View className="w-20 h-20 rounded-2xl items-center justify-center mb-5" style={{ backgroundColor: '#FDE8EC' }}>
          <Text className="text-4xl">🎯</Text>
        </View>

        <Text className="text-navy text-2xl font-bold text-center mb-2">Got a code?</Text>
        <Text className="text-gray-500 text-sm text-center mb-8">
          Enter the 6-letter code your friend shared with you.
        </Text>

        <View className="w-full">
          <JoinCodeInput value={joinCode} onChange={setJoinCode} />
        </View>

        <Button
          title="→  Join Game"
          size="lg"
          loading={loading}
          disabled={joinCode.length < 6}
          onPress={handleJoin}
          className="mt-6 w-full"
        />
      </View>
    </SafeAreaView>
  );
}
