import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Check, ArrowRight } from 'lucide-react-native';
import { Image } from 'expo-image';
import { getCharactersByIds } from '../../src/lib/packs';
import { useSetupStore } from '../../src/store/setupStore';
import { CharacterImage } from '../../src/components/game/CharacterImage';
import type { Character } from '../../src/types/game.types';

const MY_CHARS_SOURCE = '__my_characters__';
const MAX_BOARD_SIZE = 24;
const MIN_CHARACTERS = 4;

export default function PackDrill() {
  const router = useRouter();
  const { sourceId, title } = useLocalSearchParams<{ sourceId: string; title: string }>();
  const { selectedIds, toggle, selectMany, deselectMany, packCharacters, setPackCharacters, myCharacters } = useSetupStore();
  const [loading, setLoading] = useState(false);

  const isMyChars = sourceId === MY_CHARS_SOURCE;

  // Resolve the character list for this source
  const characters: Character[] = isMyChars
    ? myCharacters
    : (packCharacters[sourceId ?? ''] ?? []);

  useEffect(() => {
    if (!isMyChars && sourceId && characters.length === 0) {
      // We need to load this pack's characters. But we don't have character_ids here directly.
      // The parent (setup.tsx) should have triggered this when the user tapped the card.
      // If we somehow land here without data, show a loading state and wait.
    }
  }, [sourceId]);

  // Load pack characters if not yet in store (e.g., user navigated directly)
  const initLoad = async () => {
    if (isMyChars || !sourceId || packCharacters[sourceId]) return;
    // We need the pack's character_ids. Get them from the packs in setup store.
    const { packs } = useSetupStore.getState();
    const pack = packs.find((p) => p.id === sourceId);
    if (!pack) return;
    setLoading(true);
    try {
      const chars = await getCharactersByIds(pack.character_ids);
      setPackCharacters(sourceId, chars);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { initLoad(); }, [sourceId]);

  useEffect(() => {
    if (!characters.length) return;
    const urls = characters.map((c) => c.image_url).filter((u): u is string => !!u);
    if (urls.length) Image.prefetch(urls, { cachePolicy: 'memory-disk' });
  }, [characters]);

  const selectedCount = useSetupStore((s) => s.selectedIds.size);
  const localSelectedCount = characters.filter((c) => selectedIds.has(c.id)).length;
  const allSelected = characters.length > 0 && localSelectedCount === characters.length;
  const canStart = selectedCount >= MIN_CHARACTERS;

  const handleSelectAll = () => {
    if (allSelected) deselectMany(characters.map((c) => c.id));
    else selectMany(characters.map((c) => c.id));
  };

  const handleHostStart = async () => {
    const { selectedIds: ids } = useSetupStore.getState();
    if (ids.size < MIN_CHARACTERS) return;
    // Navigate back to setup and trigger game creation from there
    // For simplicity: navigate to review-board which has the Create game button
    router.push('/(game)/review-board' as any);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#7C3AED" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-2">
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={24} color="#1E1B4B" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSelectAll} hitSlop={8}>
          <Text className="text-primary-600 font-semibold text-sm">
            {allSelected ? 'Deselect all' : 'Select all'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <Text className="text-navy text-2xl font-bold mt-1">{title}</Text>
        <Text className="text-primary-600 font-medium text-sm mt-0.5 mb-5">
          {localSelectedCount} of {characters.length} selected
        </Text>

        {/* Character grid */}
        <View className="flex-row flex-wrap">
          {characters.map((character) => {
            const selected = selectedIds.has(character.id);
            return (
              <TouchableOpacity
                key={character.id}
                onPress={() => toggle(character.id)}
                activeOpacity={0.75}
                style={{ width: '23%', margin: '1%', position: 'relative' }}
              >
                <View
                  className="rounded-xl overflow-hidden"
                  style={{ borderWidth: 2, borderColor: selected ? '#7C3AED' : 'transparent' }}
                >
                  <CharacterImage
                    name={character.name}
                    imageUrl={character.image_url}
                    style={{ width: '100%', aspectRatio: 1 }}
                    initialsFontSize={22}
                  />
                  {selected && (
                    <View
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary-600 items-center justify-center"
                    >
                      <Check size={10} color="white" strokeWidth={3} />
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
          })}
        </View>

        <View className="h-28" />
      </ScrollView>

      {/* Sticky footer — same as setup.tsx */}
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
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleHostStart}
          disabled={!canStart}
          className="flex-row items-center gap-1.5 px-5 py-3 rounded-full"
          style={{ backgroundColor: canStart ? '#7C3AED' : '#C4B5FD' }}
          activeOpacity={0.85}
        >
          <Text className="text-white font-semibold text-sm">Create game</Text>
          <ArrowRight size={15} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
