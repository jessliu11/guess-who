import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Check, X, ArrowRight } from 'lucide-react-native';
import { useSetupStore } from '../../src/store/setupStore';
import { CharacterImage } from '../../src/components/game/CharacterImage';
import { useAuth } from '../../src/hooks/useAuth';
import { createSession } from '../../src/lib/session';
import { useGameStore } from '../../src/store/gameStore';
import type { Character } from '../../src/types/game.types';

const MY_CHARS_SOURCE = '__my_characters__';
const MIN_CHARACTERS = 4;
const MAX_BOARD_SIZE = 24;
const PREVIEW_LIMIT = 8;

interface GroupSection {
  sourceId: string;
  label: string;
  characters: Character[];
}

export default function ReviewBoard() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedIds, deselectMany, toggle, myCharacters, packs, packCharacters } = useSetupStore();
  const [loading, setLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());

  // Build grouped sections
  const sections: GroupSection[] = useMemo(() => {
    const result: GroupSection[] = [];

    // My characters
    const mySelected = myCharacters.filter((c) => selectedIds.has(c.id));
    if (mySelected.length > 0) {
      result.push({ sourceId: MY_CHARS_SOURCE, label: 'My characters', characters: mySelected });
    }

    // App packs
    for (const pack of packs) {
      const chars = packCharacters[pack.id] ?? [];
      const selected = chars.filter((c) => selectedIds.has(c.id));
      if (selected.length > 0) {
        result.push({
          sourceId: pack.id,
          label: pack.name.replace(/\s*[-–—]+\s*(Standard|Extended)\s*$/i, '').trim(),
          characters: selected,
        });
      }
    }

    return result;
  }, [selectedIds, myCharacters, packs, packCharacters]);

  const totalSelected = selectedIds.size;
  const canStart = totalSelected >= MIN_CHARACTERS;

  const handleCreate = async () => {
    if (!user || !canStart) return;
    setLoading(true);
    try {
      const finalBoardSize = Math.min(totalSelected, MAX_BOARD_SIZE);
      const session = await createSession(user.id, null, Array.from(selectedIds), finalBoardSize);
      useGameStore.getState().setMyRole('host');
      router.push(`/(game)/lobby?sessionId=${session.id}`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (sourceId: string) => {
    setExpandedSources((prev) => {
      const next = new Set(prev);
      if (next.has(sourceId)) next.delete(sourceId);
      else next.add(sourceId);
      return next;
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Handle / drag indicator */}
      <View className="items-center pt-2 pb-1">
        <View className="w-10 h-1 rounded-full bg-gray-300" />
      </View>

      {/* Header */}
      <View className="flex-row items-center px-5 pt-2 pb-2">
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={24} color="#1E1B4B" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <Text className="text-navy text-2xl font-bold mt-1">Your Board</Text>
        <View className="flex-row items-center gap-1.5 mt-0.5 mb-5">
          <Check size={14} color="#7C3AED" strokeWidth={3} />
          <Text className="text-primary-600 font-medium text-sm">{totalSelected} characters</Text>
        </View>

        {sections.map((section) => {
          const isExpanded = expandedSources.has(section.sourceId);
          const showingAll = isExpanded || section.characters.length <= PREVIEW_LIMIT;
          const visible = showingAll ? section.characters : section.characters.slice(0, PREVIEW_LIMIT);
          const overflowCount = section.characters.length - PREVIEW_LIMIT;

          return (
            <View key={section.sourceId} className="mb-6">
              {/* Section header */}
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-navy text-sm font-semibold">
                  {section.label} · {section.characters.length}
                </Text>
                <TouchableOpacity
                  onPress={() => deselectMany(section.characters.map((c) => c.id))}
                  hitSlop={8}
                >
                  <Text className="text-gray-400 text-xs">Remove all</Text>
                </TouchableOpacity>
              </View>

              {/* Character row */}
              <View className="flex-row flex-wrap">
                {visible.map((character) => (
                  <View
                    key={character.id}
                    style={{ width: '23%', margin: '1%', position: 'relative' }}
                  >
                    <View className="rounded-xl overflow-hidden">
                      <CharacterImage
                        name={character.name}
                        imageUrl={character.image_url}
                        style={{ width: '100%', aspectRatio: 1 }}
                        initialsFontSize={18}
                      />
                      <View className="bg-gray-50 px-1 py-1">
                        <Text className="text-navy text-[10px] text-center" numberOfLines={1}>
                          {character.name}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => toggle(character.id)}
                      hitSlop={4}
                      style={{ position: 'absolute', top: -5, right: -5 }}
                    >
                      <View className="w-5 h-5 rounded-full bg-gray-400 items-center justify-center border-2 border-background">
                        <X size={9} color="white" strokeWidth={3} />
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}

                {/* "+N more" tile */}
                {!showingAll && overflowCount > 0 && (
                  <TouchableOpacity
                    onPress={() => toggleExpand(section.sourceId)}
                    style={{ width: '23%', margin: '1%' }}
                  >
                    <View className="rounded-xl overflow-hidden bg-gray-100 aspect-square items-center justify-center">
                      <Text className="text-gray-500 text-xs font-semibold">+{overflowCount}</Text>
                      <Text className="text-gray-400 text-[10px]">more</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        <View className="h-24" />
      </ScrollView>

      {/* Create game button */}
      <View className="px-5 pt-3 pb-4 border-t border-[#E5E0D5] bg-background">
        <TouchableOpacity
          onPress={handleCreate}
          disabled={!canStart || loading}
          className="rounded-full py-4 flex-row items-center justify-center gap-2"
          style={{ backgroundColor: canStart ? '#7C3AED' : '#C4B5FD' }}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text className="text-white font-semibold text-base">Create game</Text>
              <ArrowRight size={16} color="white" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
