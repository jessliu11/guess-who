import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { CharacterCard } from '../../src/components/game/CharacterCard';
import { Button } from '../../src/components/ui/Button';
import { useAuth } from '../../src/hooks/useAuth';
import { useSubscription } from '../../src/hooks/useSubscription';
import { getCharactersByCategory, createPack } from '../../src/lib/packs';
import { CATEGORIES } from '../../src/constants/categories';
import { EXTENDED_PACK_MIN, EXTENDED_PACK_MAX } from '../../src/constants/config';
import type { Character } from '../../src/types/game.types';

export default function PackBuilder() {
  const router = useRouter();
  const { user } = useAuth();
  const { isPremium } = useSubscription();

  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].id);
  const [allChars, setAllChars] = useState<Character[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [packName, setPackName] = useState('');
  const [loadingChars, setLoadingChars] = useState(false);
  const [saving, setSaving] = useState(false);

  // Guard
  useEffect(() => {
    if (!isPremium) {
      Alert.alert('Pro Required', 'Pack Builder is a Pro feature.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  }, [isPremium]);

  useEffect(() => {
    setLoadingChars(true);
    getCharactersByCategory(selectedCategory, 'all')
      .then(setAllChars)
      .finally(() => setLoadingChars(false));
  }, [selectedCategory]);

  const toggleChar = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < EXTENDED_PACK_MAX) {
        next.add(id);
      } else {
        Alert.alert('Max reached', `You can select up to ${EXTENDED_PACK_MAX} characters.`);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!user) return;
    if (!packName.trim()) {
      Alert.alert('Name required', 'Please give your pack a name.');
      return;
    }
    if (selectedIds.size < EXTENDED_PACK_MIN) {
      Alert.alert('Too few characters', `Select at least ${EXTENDED_PACK_MIN} characters.`);
      return;
    }
    setSaving(true);
    try {
      const ids = Array.from(selectedIds);
      const previewUrls = allChars
        .filter((c) => ids.includes(c.id))
        .slice(0, 4)
        .map((c) => c.image_url);
      const pack = await createPack(user.id, packName.trim(), ids, previewUrls);
      Alert.alert(
        'Pack Created!',
        `Share code: ${pack.share_code}\n\nShare this code so friends can join a game with your pack.`,
        [{ text: 'Done', onPress: () => router.back() }],
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScreenHeader title="Pack Builder" />

      {/* Pack name */}
      <View className="px-4 pb-2">
        <TextInput
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-navy text-base"
          value={packName}
          onChangeText={setPackName}
          placeholder="Pack name (e.g. 90s Icons)"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Category tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 pb-2 flex-grow-0">
        <View className="flex-row gap-2 py-1">
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl border ${
                selectedCategory === cat.id
                  ? 'bg-primary-600 border-primary-600'
                  : 'bg-white border-gray-200'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  selectedCategory === cat.id ? 'text-white' : 'text-gray-500'
                }`}
              >
                {cat.emoji} {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View className="px-4 py-1">
        <Text className="text-gray-400 text-xs">
          {selectedIds.size}/{EXTENDED_PACK_MAX} selected (min {EXTENDED_PACK_MIN})
        </Text>
      </View>

      {loadingChars ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#7C3AED" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-1" showsVerticalScrollIndicator={false}>
          <View className="flex-row flex-wrap justify-center pb-4">
            {allChars.map((char) => (
              <CharacterCard
                key={char.id}
                character={char}
                selected={selectedIds.has(char.id)}
                onPress={() => toggleChar(char.id)}
              />
            ))}
          </View>
        </ScrollView>
      )}

      <View className="px-4 pb-6 pt-2">
        <Button
          title={`Save Pack (${selectedIds.size} characters)`}
          size="lg"
          loading={saving}
          disabled={selectedIds.size < EXTENDED_PACK_MIN || !packName.trim()}
          onPress={handleSave}
        />
      </View>
    </SafeAreaView>
  );
}
