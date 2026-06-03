import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../../src/hooks/useSubscription';
import { useAuth } from '../../src/hooks/useAuth';
import { FREE_CATEGORY_IDS } from '../../src/constants/config';
import { getSystemPacks, getMyPacks, deletePack, getCharactersByIds } from '../../src/lib/packs';
import { getMyCustomCharacters, deleteCustomCharacter } from '../../src/lib/characters';
import { CharacterImage } from '../../src/components/game/CharacterImage';
import type { CharacterPack, Character } from '../../src/types/game.types';

function displayPackName(name: string) {
  return name.replace(/\s*[-–—]+\s*(Standard|Extended)\s*$/i, '').trim();
}

function PackIcon({ pack }: { pack: CharacterPack }) {
  const imgUrl = pack.preview_image_urls?.[0];
  return (
    <View className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 items-center justify-center mr-4">
      {imgUrl ? (
        <Image source={{ uri: imgUrl }} className="w-full h-full" resizeMode="cover" />
      ) : (
        <Text className="text-xl">🎴</Text>
      )}
    </View>
  );
}

function PackRow({
  pack,
  isExpanded,
  isLocked,
  characters,
  loadingChars,
  onToggleExpand,
  onDelete, // ability to delete customized packs
  showShareCode, // there is the ability to share packs (for customized packs)
}: {
  pack: CharacterPack;
  isExpanded: boolean;
  isLocked: boolean;
  characters: Character[];
  loadingChars: boolean;
  onToggleExpand: () => void;
  onDelete?: () => void;
  showShareCode?: boolean;
}) {
  return (
    <View className="mb-2 rounded-2xl bg-white border border-gray-200 overflow-hidden">
      <TouchableOpacity
        onPress={onToggleExpand}
        activeOpacity={0.7}
        className="p-5 flex-row items-center"
      >
        <PackIcon pack={pack} />

        <View className="flex-1">
          <View className="flex-row items-center gap-2 flex-wrap">
            <Text className={`text-lg font-bold ${isLocked ? 'text-gray-400' : 'text-navy'}`}>
              {displayPackName(pack.name)}
            </Text>
            {showShareCode && pack.share_code && (
              <View className="bg-primary-600 px-2 py-0.5 rounded-full">
                <Text className="text-white text-[10px] font-bold">{pack.share_code}</Text>
              </View>
            )}
            {isLocked && (
              <View className="bg-navy px-2 py-0.5 rounded-full flex-row items-center gap-1">
                <Text className="text-accent text-[10px]">⭐</Text>
                <Text className="text-white text-[10px] font-bold">PRO</Text>
              </View>
            )}
          </View>
          <Text className="text-gray-400 text-sm mt-0.5">
            {pack.character_ids.length} characters
          </Text>
        </View>

        <View className="flex-row items-center gap-3">
          {onDelete && (
            <TouchableOpacity
              onPress={onDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text className="text-danger text-sm">Delete</Text>
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
        <View className="border-t border-gray-200 px-3 pb-3 pt-2">
          {loadingChars ? (
            <ActivityIndicator color="#7C3AED" className="my-4" />
          ) : (
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
                    initialsFontSize={22}
                  />
                  <View className="bg-gray-50 px-1 py-1">
                    <Text className="text-navy text-[10px] text-center" numberOfLines={1}>
                      {character.name}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default function Packs() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPremium } = useSubscription();
  const { user } = useAuth();
  const [systemPacks, setSystemPacks] = useState<CharacterPack[]>([]);
  const [myPacks, setMyPacks] = useState<CharacterPack[]>([]);
  const [customCharacters, setCustomCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPackIds, setExpandedPackIds] = useState<Set<string>>(new Set());
  const [packCharacters, setPackCharacters] = useState<Record<string, Character[]>>({});
  const [loadingCharacters, setLoadingCharacters] = useState<Record<string, boolean>>({});

  const load = async () => {
    try {
      const [sp, mp, cc] = await Promise.all([
        getSystemPacks(),
        user ? getMyPacks(user.id) : Promise.resolve([]),
        user ? getMyCustomCharacters(user.id) : Promise.resolve([]),
      ]);
      setSystemPacks(sp);
      setMyPacks(mp);
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

  const handleDeleteCustomCharacter = (character: Character) => {
    Alert.alert('Delete Character', `Delete "${character.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!user) return;
          await deleteCustomCharacter(character.id, user.id);
          setCustomCharacters((prev) => prev.filter((c) => c.id !== character.id));
        },
      },
    ]);
  };

  const handleDelete = (pack: CharacterPack) => {
    Alert.alert('Delete Pack', `Delete "${pack.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!user) return;
          await deletePack(pack.id, user.id);
          setMyPacks((p) => p.filter((x) => x.id !== pack.id));
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }} className="bg-background items-center justify-center">
        <ActivityIndicator color="#7C3AED" />
      </View>
    );
  }


  return (
    <View style={{ flex: 1, paddingTop: insets.top }} className="bg-background">
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="pt-6 pb-4 flex-row items-end justify-between">
          <View>
            <Text className="text-gray-400 text-xs font-medium">Your collection</Text>
            <Text className="text-navy text-3xl font-bold mt-0.5" style={{ fontFamily: 'Inter_700Bold' }}>Packs</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(game)/character-creator' as any)}
            className="bg-navy px-4 py-2 rounded-full flex-row items-center gap-1.5"
          >
            <Ionicons name="add" size={16} color="white" />
            <Text className="text-white text-sm font-semibold">Create</Text>
          </TouchableOpacity>
        </View>

        {/* My Characters */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-navy font-bold text-base">My Characters</Text>
            {customCharacters.length > 0 && (
              <Text className="text-gray-400 text-xs">Long press to delete</Text>
            )}
          </View>

          <View className="flex-row flex-wrap">
            {customCharacters.map((character) => (
              <TouchableOpacity
                key={character.id}
                onLongPress={() => handleDeleteCustomCharacter(character)}
                activeOpacity={0.8}
                style={{ width: '23%', margin: '1%' }}
                className="rounded-xl overflow-hidden"
              >
                <CharacterImage
                  name={character.name}
                  imageUrl={character.image_url}
                  style={{ width: '100%', aspectRatio: 1 }}
                  initialsFontSize={22}
                />
                <View className="bg-gray-50 px-1 py-1">
                  <Text className="text-navy text-[10px] text-center" numberOfLines={1}>
                    {character.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Add new character */}
            <TouchableOpacity
              onPress={() => router.push('/(game)/character-creator' as any)}
              activeOpacity={0.7}
              style={{ width: '23%', margin: '1%' }}
              className="rounded-xl overflow-hidden"
            >
              <View
                style={{ aspectRatio: 1 }}
                className="items-center justify-center border-2 border-dashed border-gray-300 rounded-xl"
              >
                <Ionicons name="add" size={24} color="#9CA3AF" />
              </View>
              <View className="bg-gray-50 px-1 py-1">
                <Text className="text-gray-400 text-[10px] text-center">Add</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* My Packs */}
        {myPacks.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-navy font-bold text-base">My Packs</Text>
              <Text className="text-gray-400 text-sm">{myPacks.length} pack{myPacks.length !== 1 ? 's' : ''}</Text>
            </View>
            {myPacks.map((pack) => (
              <PackRow
                key={pack.id}
                pack={pack}
                isExpanded={expandedPackIds.has(pack.id)}
                isLocked={false}
                characters={packCharacters[pack.id] ?? []}
                loadingChars={loadingCharacters[pack.id] ?? false}
                onToggleExpand={() => togglePackExpansion(pack)}
                onDelete={() => handleDelete(pack)}
                showShareCode
              />
            ))}
          </View>
        )}

        {/* All packs — Standard only (one per category) */}
        {systemPacks.filter((p) => !p.requires_premium).length > 0 && (() => {
          const isFreePack = (p: CharacterPack) =>
            FREE_CATEGORY_IDS.includes(p.category_id ?? '');
          const sortedPacks = systemPacks
            .filter((p) => !p.requires_premium)
            .sort((a, b) => {
              const aFree = isFreePack(a);
              const bFree = isFreePack(b);
              if (aFree && !bFree) return -1;
              if (!aFree && bFree) return 1;
              return 0;
            });
          return (
            <View className="mb-8">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-navy font-bold text-base">Packs</Text>
                {!isPremium && <Text className="text-gray-400 text-sm">Unlock all with Pro</Text>}
              </View>
              {sortedPacks.map((pack) => {
                const isLocked = !isPremium && !isFreePack(pack);
                return (
                  <PackRow
                    key={pack.id}
                    pack={pack}
                    isExpanded={expandedPackIds.has(pack.id)}
                    isLocked={isLocked}
                    characters={packCharacters[pack.id] ?? []}
                    loadingChars={loadingCharacters[pack.id] ?? false}
                    onToggleExpand={() => {
                      if (isLocked) { router.push('/paywall'); return; }
                      togglePackExpansion(pack);
                    }}
                  />
                );
              })}

              {/* Upgrade to Pro banner */}
              {!isPremium && (
                <TouchableOpacity
                  onPress={() => router.push('/paywall')}
                  className="mt-2 rounded-2xl p-5 flex-row items-center gap-4"
                  style={{ backgroundColor: '#1E1B4B' }}
                  activeOpacity={0.85}
                >
                  <View className="w-12 h-12 rounded-xl bg-accent items-center justify-center">
                    <Text className="text-xl">⭐</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-base">Upgrade to Pro</Text>
                    <Text className="text-white/60 text-sm mt-0.5">Unlock all 8 packs + Pack Builder</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={20} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              )}
            </View>
          );
        })()}
      </ScrollView>
    </View>
  );
}
