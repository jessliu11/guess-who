import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus, Lock, ChevronRight, ArrowRight } from 'lucide-react-native';
import { useSubscription } from '../../src/hooks/useSubscription';
import { useAuth } from '../../src/hooks/useAuth';
import { FREE_CATEGORY_IDS } from '../../src/constants/config';
import { getSystemPacks } from '../../src/lib/packs';
import { getMyCustomCharacters } from '../../src/lib/characters';
import { CharacterImage } from '../../src/components/game/CharacterImage';
import type { CharacterPack, Character } from '../../src/types/game.types';

function displayPackName(name: string) {
  return name.replace(/\s*[-–—]+\s*(Standard|Extended)\s*$/i, '').trim();
}

/** 2×2 collage of the first 4 preview images for a pack card */
function PackCollage({ urls }: { urls: string[] }) {
  const slots = [0, 1, 2, 3];
  return (
    <View className="w-full aspect-square flex-row flex-wrap">
      {slots.map((i) => (
        <View key={i} style={{ width: '50%', height: '50%' }}>
          {urls[i] ? (
            <Image source={{ uri: urls[i] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View className="w-full h-full bg-gray-100" />
          )}
        </View>
      ))}
    </View>
  );
}

/** Card for an app-provided pack in the 2-column grid */
function PackCard({
  pack,
  isLocked,
  onPress,
}: {
  pack: CharacterPack;
  isLocked: boolean;
  onPress: () => void;
}) {
  const previewUrls = pack.preview_image_urls ?? [];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="rounded-2xl overflow-hidden bg-white border border-[#E5E0D5]"
      style={{ flex: 1 }}
    >
      <View style={{ position: 'relative' }}>
        <PackCollage urls={previewUrls} />
        {isLocked && (
          <View
            className="absolute inset-0 items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
          >
            <View className="bg-white/90 rounded-full p-2">
              <Lock size={16} color="#1E1B4B" />
            </View>
          </View>
        )}
      </View>
      <View className="px-3 py-2.5">
        <Text className="text-navy text-sm font-semibold" numberOfLines={1}>
          {displayPackName(pack.name)}
        </Text>
        <Text className="text-gray-400 text-xs mt-0.5">
          {pack.character_ids.length} characters
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function Packs() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPremium } = useSubscription();
  const { user } = useAuth();
  const [systemPacks, setSystemPacks] = useState<CharacterPack[]>([]);
  const [customCharacters, setCustomCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [sp, cc] = await Promise.all([
        getSystemPacks(),
        user ? getMyCustomCharacters(user.id) : Promise.resolve([]),
      ]);
      setSystemPacks(sp);
      setCustomCharacters(cc);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        getMyCustomCharacters(user.id).then(setCustomCharacters).catch(() => {});
      }
    }, [user]),
  );

  if (loading) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }} className="bg-background items-center justify-center">
        <ActivityIndicator color="#7C3AED" />
      </View>
    );
  }

  const isFreePack = (p: CharacterPack) => FREE_CATEGORY_IDS.includes(p.category_id ?? '');

  // Deduplicate: show one pack per category (standard)
  const sortedPacks = [...systemPacks]
    .filter((p) => !p.requires_premium)
    .sort((a, b) => {
      if (isFreePack(a) && !isFreePack(b)) return -1;
      if (!isFreePack(a) && isFreePack(b)) return 1;
      return 0;
    });

  // Thumbnail previews for My Characters row (first 3)
  const myCharPreviewUrls = customCharacters
    .filter((c) => !!c.image_url)
    .slice(0, 3)
    .map((c) => c.image_url!);

  return (
    <View style={{ flex: 1, paddingTop: insets.top }} className="bg-background">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="pt-6 pb-4 flex-row items-end justify-between">
          <View>
            <Text className="text-gray-400 text-xs font-medium">Your collection</Text>
            <Text className="text-navy text-3xl font-bold mt-0.5">Packs</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(game)/character-creator' as any)}
            className="bg-primary-600 px-4 py-2 rounded-full flex-row items-center gap-1.5"
          >
            <Plus size={14} color="white" />
            <Text className="text-white text-sm font-semibold">Create</Text>
          </TouchableOpacity>
        </View>

        {/* Filter chips hidden — post-MVP scope */}
        {false && <View className="flex-row gap-2 mb-5">
          {(['All', 'Who', 'Where'] as const).map((label) => (
            <TouchableOpacity key={label} disabled className="px-4 py-1.5 rounded-full border border-[#E5E0D5]">
              <Text className="text-sm font-medium text-gray-400">{label}</Text>
            </TouchableOpacity>
          ))}
        </View>}

        {/* Yours section */}
        <Text className="text-navy text-sm font-semibold mb-2">Yours</Text>
        <TouchableOpacity
          onPress={() => router.push('/(game)/my-characters' as any)}
          activeOpacity={0.85}
          className="bg-white rounded-2xl border border-[#E5E0D5] px-4 py-3.5 flex-row items-center mb-6"
        >
          {/* Thumbnail cluster */}
          <View className="flex-row mr-3" style={{ width: 60 }}>
            {myCharPreviewUrls.length > 0 ? (
              myCharPreviewUrls.map((url, i) => (
                <View
                  key={i}
                  className="w-8 h-8 rounded-full overflow-hidden border-2 border-background"
                  style={{ marginLeft: i === 0 ? 0 : -8 }}
                >
                  <Image source={{ uri: url }} className="w-full h-full" resizeMode="cover" />
                </View>
              ))
            ) : (
              customCharacters.slice(0, 3).map((c, i) => (
                <View
                  key={c.id}
                  className="w-8 h-8 rounded-full overflow-hidden border-2 border-background"
                  style={{ marginLeft: i === 0 ? 0 : -8 }}
                >
                  <CharacterImage
                    name={c.name}
                    imageUrl={null}
                    style={{ width: '100%', height: '100%' }}
                    initialsFontSize={10}
                  />
                </View>
              ))
            )}
          </View>
          <View className="flex-1">
            <Text className="text-navy text-sm font-semibold">My characters</Text>
            <Text className="text-gray-400 text-xs mt-0.5">
              {customCharacters.length} characters · tap to manage
            </Text>
          </View>
          <ChevronRight size={18} color="#9CA3AF" />
        </TouchableOpacity>

        {/* From the app */}
        <Text className="text-navy text-sm font-semibold mb-3">From the app</Text>
        <View className="flex-row flex-wrap gap-3 mb-6">
          {sortedPacks.map((pack) => {
            const isLocked = !isPremium && !isFreePack(pack);
            return (
              <View key={pack.id} style={{ width: '47%' }}>
                <PackCard
                  pack={pack}
                  isLocked={isLocked}
                  onPress={() => {
                    if (isLocked) { router.push('/paywall'); return; }
                    router.push({ pathname: '/(game)/pack-detail', params: { packId: pack.id } } as any);
                  }}
                />
              </View>
            );
          })}
        </View>

        {/* Upgrade banner */}
        {!isPremium && (
          <TouchableOpacity
            onPress={() => router.push('/paywall')}
            className="rounded-2xl p-5 flex-row items-center gap-4 mb-8"
            style={{ backgroundColor: '#1E1B4B' }}
            activeOpacity={0.85}
          >
            <View className="w-12 h-12 rounded-xl bg-accent items-center justify-center">
              <Text className="text-xl">⭐</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-base">Upgrade to Pro</Text>
              <Text className="text-white/60 text-sm mt-0.5">Unlock all packs + Pack Builder</Text>
            </View>
            <ArrowRight size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
