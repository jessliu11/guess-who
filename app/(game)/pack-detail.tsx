import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Info } from 'lucide-react-native';
import { Image } from 'expo-image';
import { getPackById, getCharactersByIds } from '../../src/lib/packs';
import { CharacterImage } from '../../src/components/game/CharacterImage';
import type { CharacterPack, Character } from '../../src/types/game.types';

function displayPackName(name: string) {
  return name.replace(/\s*[-–—]+\s*(Standard|Extended)\s*$/i, '').trim();
}

export default function PackDetail() {
  const router = useRouter();
  const { packId } = useLocalSearchParams<{ packId: string }>();
  const [pack, setPack] = useState<CharacterPack | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!packId) return;
    (async () => {
      const p = await getPackById(packId);
      setPack(p);
      if (p) {
        const chars = await getCharactersByIds(p.character_ids);
        setCharacters(chars);
        const urls = chars.map((c) => c.image_url).filter((u): u is string => !!u);
        if (urls.length) Image.prefetch(urls, { cachePolicy: 'memory-disk' });
      }
      setLoading(false);
    })();
  }, [packId]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#7C3AED" />
      </SafeAreaView>
    );
  }

  if (!pack) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-gray-400">Pack not found.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-primary-600 font-semibold">Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const packName = displayPackName(pack.name);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-2 pb-2">
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={24} color="#1E1B4B" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text className="text-navy text-2xl font-bold mt-2">{packName}</Text>
        <View className="flex-row items-center gap-1.5 mt-1 mb-5">
          <Info size={13} color="#9CA3AF" />
          <Text className="text-gray-400 text-sm">
            {pack.character_ids.length} characters{pack.description ? ` · ${pack.description}` : ''}
          </Text>
        </View>

        {/* Read-only character grid */}
        <View className="flex-row flex-wrap">
          {characters.map((character) => (
            <View
              key={character.id}
              style={{ width: '23%', margin: '1%' }}
              className="rounded-xl overflow-hidden"
            >
              <CharacterImage
                name={character.name}
                imageUrl={character.image_url}
                style={{ width: '100%', aspectRatio: 1 }}
                initialsFontSize={20}
              />
              <View className="bg-gray-50 px-1 py-1">
                <Text className="text-navy text-[10px] text-center" numberOfLines={1}>
                  {character.name}
                </Text>
              </View>
            </View>
          ))}
        </View>
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
