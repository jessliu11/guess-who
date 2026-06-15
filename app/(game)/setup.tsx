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
import { ChevronLeft, Lock, Check, Minus, ChevronRight, ArrowRight } from 'lucide-react-native';
import { JoinCodeInput } from '../../src/components/ui/JoinCodeInput';
import { Button } from '../../src/components/ui/Button';
import { CharacterImage } from '../../src/components/game/CharacterImage';
import { useAuth } from '../../src/hooks/useAuth';
import { useSubscription } from '../../src/hooks/useSubscription';
import { FREE_CATEGORY_IDS } from '../../src/constants/config';
import { getSystemPacks, getCharactersByIds } from '../../src/lib/packs';
import { getMyCustomCharacters } from '../../src/lib/characters';
import { createSession, joinSession } from '../../src/lib/session';
import { useGameStore } from '../../src/store/gameStore';
import { useSetupStore } from '../../src/store/setupStore';
import type { CharacterPack } from '../../src/types/game.types';

const MIN_CHARACTERS = 4;
const MAX_BOARD_SIZE = 24;
const MY_CHARS_SOURCE = '__my_characters__';

function displayPackName(name: string) {
  return name.replace(/\s*[-–—]+\s*(Standard|Extended)\s*$/i, '').trim();
}

/** 2×2 collage thumbnail */
function PackCollage({ urls }: { urls: string[] }) {
  const slots = [0, 1, 2, 3];
  return (
    <View className="w-full aspect-square flex-row flex-wrap">
      {slots.map((i) => (
        <View key={i} style={{ width: '50%', height: '50%' }}>
          {urls[i]
            ? <Image source={{ uri: urls[i] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            : <View className="w-full h-full bg-gray-100" />
          }
        </View>
      ))}
    </View>
  );
}

/** Circle toggle indicator for pack selection state */
function SelectCircle({ state }: { state: 'none' | 'partial' | 'all' }) {
  if (state === 'all') {
    return (
      <View className="w-7 h-7 rounded-full bg-primary-600 items-center justify-center">
        <Check size={14} color="white" strokeWidth={3} />
      </View>
    );
  }
  if (state === 'partial') {
    return (
      <View className="w-7 h-7 rounded-full bg-primary-600 items-center justify-center">
        <Minus size={14} color="white" strokeWidth={3} />
      </View>
    );
  }
  return (
    <View className="w-7 h-7 rounded-full border-2 border-gray-300" />
  );
}

function PackCard({
  pack,
  isLocked,
  onPressBody,
  onPressCircle,
  circleState,
}: {
  pack: CharacterPack;
  isLocked: boolean;
  onPressBody: () => void;
  onPressCircle: () => void;
  circleState: 'none' | 'partial' | 'all';
}) {
  const previewUrls = pack.preview_image_urls ?? [];
  const selectedCount = useSetupStore((s) =>
    (s.packCharacters[pack.id] ?? []).filter((c) => s.selectedIds.has(c.id)).length
  );

  return (
    <TouchableOpacity
      onPress={onPressBody}
      activeOpacity={0.85}
      className="rounded-2xl overflow-hidden bg-white border border-[#E5E0D5]"
      style={{ flex: 1 }}
    >
      <View style={{ position: 'relative' }}>
        <PackCollage urls={previewUrls} />
        {isLocked ? (
          <View className="absolute inset-0 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
            <View className="bg-white/90 rounded-full p-2">
              <Lock size={16} color="#1E1B4B" />
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={onPressCircle}
            hitSlop={8}
            style={{ position: 'absolute', top: 8, right: 8 }}
          >
            <SelectCircle state={circleState} />
          </TouchableOpacity>
        )}
      </View>
      <View className="px-3 py-2.5">
        <Text className="text-navy text-sm font-semibold" numberOfLines={1}>{displayPackName(pack.name)}</Text>
        <Text className="text-gray-400 text-xs mt-0.5">
          {selectedCount > 0 ? `${selectedCount} of ${pack.character_ids.length} selected` : `${pack.character_ids.length} characters`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function Setup() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode: 'host' | 'join' }>();
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const clearGame = useGameStore((s) => s.clearGame);

  const { selectedIds, selectMany, deselectMany, setPackCharacters, setMyCharacters, setPacks, reset, myCharacters, packs, packCharacters } = useSetupStore();
  const isHost = mode !== 'join';

  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPacks, setLoadingPacks] = useState(isHost);
  const [togglingPackId, setTogglingPackId] = useState<string | null>(null);

  useEffect(() => {
    clearGame();
    reset();
    if (isHost) {
      Promise.all([
        getSystemPacks(),
        user ? getMyCustomCharacters(user.id) : Promise.resolve([]),
      ]).then(([sp, cc]) => {
        setPacks(sp);
        setMyCharacters(cc);
      }).finally(() => setLoadingPacks(false));
    }
  }, [isHost, user]);

  const ensurePackCharsLoaded = async (packId: string, characterIds: string[]) => {
    if (packCharacters[packId]) return packCharacters[packId];
    const chars = await getCharactersByIds(characterIds);
    setPackCharacters(packId, chars);
    return chars;
  };

  const handleTogglePack = async (pack: CharacterPack, isLocked: boolean) => {
    if (isLocked) { router.push('/paywall'); return; }
    setTogglingPackId(pack.id);
    try {
      const chars = await ensurePackCharsLoaded(pack.id, pack.character_ids);
      const ids = chars.map((c) => c.id);
      const allSelected = ids.every((id) => selectedIds.has(id));
      if (allSelected) deselectMany(ids);
      else selectMany(ids);
    } finally {
      setTogglingPackId(null);
    }
  };

  const handleToggleMyChars = () => {
    const ids = myCharacters.map((c) => c.id);
    const allSelected = ids.every((id) => selectedIds.has(id));
    if (allSelected) deselectMany(ids);
    else selectMany(ids);
  };

  const handleHostStart = async () => {
    if (!user || selectedIds.size < MIN_CHARACTERS) return;
    setLoading(true);
    try {
      const finalBoardSize = Math.min(selectedIds.size, MAX_BOARD_SIZE);
      const session = await createSession(user.id, null, Array.from(selectedIds), finalBoardSize);
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

    const isFreePack = (p: CharacterPack) => FREE_CATEGORY_IDS.includes(p.category_id ?? '');
    const sortedPacks = [...packs]
      .filter((p) => !p.requires_premium)
      .sort((a, b) => {
        if (isFreePack(a) && !isFreePack(b)) return -1;
        if (!isFreePack(a) && isFreePack(b)) return 1;
        return 0;
      });
    const extendedPacks = packs.filter((p) => p.requires_premium);
    const allPacks = [...sortedPacks, ...extendedPacks];

    const selectedCount = selectedIds.size;
    const canStart = selectedCount >= MIN_CHARACTERS;

    // My characters selection state
    const mySelectedCount = myCharacters.filter((c) => selectedIds.has(c.id)).length;
    const myCircleState: 'none' | 'partial' | 'all' =
      mySelectedCount === 0 ? 'none' :
      mySelectedCount === myCharacters.length ? 'all' : 'partial';

    const getPackCircleState = (pack: CharacterPack): 'none' | 'partial' | 'all' => {
      const chars = packCharacters[pack.id];
      if (!chars || chars.length === 0) {
        const selectedFromIds = pack.character_ids.filter((id) => selectedIds.has(id)).length;
        if (selectedFromIds === 0) return 'none';
        if (selectedFromIds === pack.character_ids.length) return 'all';
        return 'partial';
      }
      const n = chars.filter((c) => selectedIds.has(c.id)).length;
      if (n === 0) return 'none';
      if (n === chars.length) return 'all';
      return 'partial';
    };

    const myCharPreviewUrls = myCharacters
      .filter((c) => !!c.image_url)
      .slice(0, 3)
      .map((c) => c.image_url!);

    return (
      <SafeAreaView className="flex-1 bg-background">
        {/* Header */}
        <View className="px-5 pt-2 pb-2">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <ChevronLeft size={24} color="#1E1B4B" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          <Text className="text-navy text-2xl font-bold mt-1">Host Game</Text>
          <Text className="text-gray-400 text-sm mt-0.5 mb-5">Select characters for the board</Text>

          {/* Yours section */}
          {myCharacters.length > 0 && (
            <>
              <Text className="text-navy text-sm font-semibold mb-2">Yours</Text>
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/(game)/pack-drill', params: { sourceId: MY_CHARS_SOURCE, title: 'My characters' } } as any)}
                activeOpacity={0.85}
                className="rounded-2xl border px-4 py-3.5 flex-row items-center mb-5"
                style={{ backgroundColor: mySelectedCount > 0 ? '#EDE9FE' : 'white', borderColor: mySelectedCount > 0 ? '#C4B5FD' : '#E5E0D5' }}
              >
                {/* Thumbnail cluster — fixed width prevents overflow into text */}
                <View style={{ width: 72, marginRight: 12, flexDirection: 'row', alignItems: 'center' }}>
                  {myCharPreviewUrls.length > 0
                    ? myCharPreviewUrls.map((url, i) => (
                        <View key={i} className="w-9 h-9 rounded-full overflow-hidden border-2 border-white" style={{ marginLeft: i === 0 ? 0 : -10 }}>
                          <Image source={{ uri: url }} className="w-full h-full" resizeMode="cover" />
                        </View>
                      ))
                    : myCharacters.slice(0, 3).map((c, i) => (
                        <View key={c.id} className="w-9 h-9 rounded-full overflow-hidden border-2 border-white" style={{ marginLeft: i === 0 ? 0 : -10 }}>
                          <CharacterImage name={c.name} imageUrl={null} style={{ width: '100%', height: '100%' }} initialsFontSize={10} />
                        </View>
                      ))
                  }
                </View>
                <View className="flex-1">
                  <Text className="text-navy text-sm font-semibold">My characters</Text>
                  <Text className={`text-xs mt-0.5 ${mySelectedCount > 0 ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
                    {mySelectedCount > 0 ? `${mySelectedCount} of ${myCharacters.length} selected` : `${myCharacters.length} characters`}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleToggleMyChars} hitSlop={8} className="mr-2">
                  <SelectCircle state={myCircleState} />
                </TouchableOpacity>
              </TouchableOpacity>
            </>
          )}

          {/* From the app section */}
          <Text className="text-navy text-sm font-semibold mb-3">From the app</Text>
          <View className="flex-row flex-wrap gap-3 mb-6">
            {allPacks.map((pack) => {
              const isLocked = !isPremium && !isFreePack(pack) && !pack.requires_premium || (!isPremium && pack.requires_premium);
              return (
                <View key={pack.id} style={{ width: '47%' }}>
                  <PackCard
                    pack={pack}
                    isLocked={isLocked}
                    onPressBody={() => {
                      if (isLocked) { router.push('/paywall'); return; }
                      router.push({ pathname: '/(game)/pack-drill', params: { sourceId: pack.id, title: displayPackName(pack.name) } } as any);
                    }}
                    onPressCircle={() => handleTogglePack(pack, isLocked)}
                    circleState={getPackCircleState(pack)}
                  />
                  {togglingPackId === pack.id && (
                    <View className="absolute inset-0 items-center justify-center rounded-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}>
                      <ActivityIndicator color="#7C3AED" />
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          <View className="h-28" />
        </ScrollView>

        {/* Sticky footer */}
        <View className="bg-background border-t border-[#E5E0D5] px-5 pt-3 pb-4 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.push('/(game)/review-board' as any)}
            disabled={selectedCount === 0}
          >
            <Text className={`text-base font-bold ${selectedCount > 0 ? 'text-navy' : 'text-gray-300'}`}>
              {selectedCount} selected {selectedCount > 0 ? '›' : ''}
            </Text>
            {selectedCount > MAX_BOARD_SIZE && (
              <Text className="text-gray-400 text-xs mt-0.5">24 will be randomly drawn</Text>
            )}
            {selectedCount > 0 && selectedCount <= MAX_BOARD_SIZE && (
              <Text className="text-gray-400 text-xs mt-0.5">tap to review</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleHostStart}
            disabled={!canStart || loading}
            className="flex-row items-center gap-1.5 px-5 py-3 rounded-full"
            style={{ backgroundColor: canStart ? '#7C3AED' : '#C4B5FD' }}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Text className="text-white font-semibold text-sm">Create game</Text>
                <ArrowRight size={15} color="white" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ---- JOIN VIEW ----
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-5 pt-2 pb-2">
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={24} color="#1E1B4B" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 px-6 pt-8 items-center">
        <Text className="text-navy text-2xl font-bold text-center mb-2">Got a code?</Text>
        <Text className="text-gray-500 text-sm text-center mb-8">
          Enter the 6-letter code your friend shared with you.
        </Text>

        <View className="w-full">
          <JoinCodeInput value={joinCode} onChange={setJoinCode} />
        </View>

        <Button
          title="Join Game"
          size="lg"
          loading={loading}
          disabled={joinCode.length < 6}
          onPress={handleJoin}
          className="mt-6 w-full"
          icon={<ArrowRight size={16} color="white" />}
        />
      </View>
    </SafeAreaView>
  );
}
