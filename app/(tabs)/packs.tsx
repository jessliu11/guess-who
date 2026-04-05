import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSubscription } from '../../src/hooks/useSubscription';
import { useAuth } from '../../src/hooks/useAuth';
import { getSystemPacks, getMyPacks, deletePack, getCharactersByIds } from '../../src/lib/packs';
import type { CharacterPack, Character } from '../../src/types/game.types';

function PackSection({
  pack,
  isExpanded,
  isLocked,
  characters,
  loadingChars,
  onToggleExpand,
  onDelete,
}: {
  pack: CharacterPack;
  isExpanded: boolean;
  isLocked: boolean;
  characters: Character[];
  loadingChars: boolean;
  onToggleExpand: () => void;
  onDelete?: () => void;
}) {
  return (
    <View className="mb-3 rounded-2xl border border-slate-700 bg-surface-card overflow-hidden">
      {/* Header row */}
      <TouchableOpacity
        onPress={onToggleExpand}
        activeOpacity={0.7}
        className="px-4 py-3 flex-row items-center justify-between"
      >
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className={`font-semibold text-sm ${isLocked ? 'text-slate-400' : 'text-white'}`}>
              {pack.name}
            </Text>
            {pack.requires_premium && !isLocked && (
              <View className="bg-accent/20 px-2 py-0.5 rounded-full border border-accent/30">
                <Text className="text-accent text-xs font-medium">PRO</Text>
              </View>
            )}
            {isLocked && <Text className="text-slate-500 text-xs">🔒 Pro</Text>}
          </View>
          {pack.share_code && !pack.is_system && (
            <Text className="text-slate-500 text-xs mt-0.5">Code: {pack.share_code}</Text>
          )}
          <Text className="text-slate-500 text-xs mt-0.5">
            {pack.character_ids.length} characters
          </Text>
        </View>

        <View className="flex-row items-center gap-3">
          {onDelete && (
            <TouchableOpacity
              onPress={onDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text className="text-red-400 text-sm">Delete</Text>
            </TouchableOpacity>
          )}
          <Text className="text-slate-400 text-lg">{isExpanded ? '▾' : '▸'}</Text>
        </View>
      </TouchableOpacity>

      {/* Character grid */}
      {isExpanded && (
        <View className="border-t border-slate-700 px-2 pb-3 pt-2">
          {loadingChars ? (
            <ActivityIndicator color="#6471f1" className="my-4" />
          ) : (
            <View className="flex-row flex-wrap">
              {characters.map((character) => (
                <View
                  key={character.id}
                  style={{ width: '23%', margin: '1%' }}
                  className="rounded-xl overflow-hidden border border-slate-700"
                >
                  <Image
                    source={{ uri: character.image_url }}
                    style={{ width: '100%', aspectRatio: 1 }}
                    resizeMode="cover"
                  />
                  <View className="bg-surface px-1 py-1">
                    <Text className="text-white text-[10px] text-center" numberOfLines={1}>
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
  const router = useRouter();
  const { isPremium } = useSubscription();
  const { user } = useAuth();
  const [systemPacks, setSystemPacks] = useState<CharacterPack[]>([]);
  const [myPacks, setMyPacks] = useState<CharacterPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPackIds, setExpandedPackIds] = useState<Set<string>>(new Set());
  const [packCharacters, setPackCharacters] = useState<Record<string, Character[]>>({});
  const [loadingCharacters, setLoadingCharacters] = useState<Record<string, boolean>>({});

  const load = async () => {
    try {
      const [sp, mp] = await Promise.all([
        getSystemPacks(),
        user ? getMyPacks(user.id) : Promise.resolve([]),
      ]);
      setSystemPacks(sp);
      setMyPacks(mp);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

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
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator color="#6471f1" />
      </SafeAreaView>
    );
  }

  const standardPacks = systemPacks.filter((p) => !p.requires_premium);
  const extendedPacks = systemPacks.filter((p) => p.requires_premium);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="pt-6 pb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-white text-2xl font-bold">Packs</Text>
            <Text className="text-slate-400 text-sm mt-0.5">Browse & build character packs</Text>
          </View>
          {isPremium && (
            <TouchableOpacity
              onPress={() => router.push('/(game)/pack-builder')}
              className="bg-primary-600 px-4 py-2 rounded-xl"
            >
              <Text className="text-white text-sm font-semibold">+ Build</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Build CTA for free users */}
        {!isPremium && (
          <TouchableOpacity
            onPress={() => router.push('/paywall')}
            className="bg-primary-950 border border-primary-700 rounded-2xl p-4 mb-5 flex-row items-center gap-3"
          >
            <Text className="text-2xl">⭐</Text>
            <View className="flex-1">
              <Text className="text-white font-semibold text-sm">Build Custom Packs</Text>
              <Text className="text-slate-400 text-xs mt-0.5">
                Upgrade to Pro to create & share custom character packs
              </Text>
            </View>
            <Text className="text-primary-400 font-bold">›</Text>
          </TouchableOpacity>
        )}

        {/* My Packs */}
        {myPacks.length > 0 && (
          <View className="mb-5">
            <Text className="text-slate-300 font-semibold text-sm mb-3">My Packs</Text>
            {myPacks.map((pack) => (
              <PackSection
                key={pack.id}
                pack={pack}
                isExpanded={expandedPackIds.has(pack.id)}
                isLocked={false}
                characters={packCharacters[pack.id] ?? []}
                loadingChars={loadingCharacters[pack.id] ?? false}
                onToggleExpand={() => togglePackExpansion(pack)}
                onDelete={() => handleDelete(pack)}
              />
            ))}
          </View>
        )}

        {/* Standard packs */}
        <View className="mb-5">
          <Text className="text-slate-300 font-semibold text-sm mb-3">Standard Packs — Free</Text>
          {standardPacks.map((pack) => (
            <PackSection
              key={pack.id}
              pack={pack}
              isExpanded={expandedPackIds.has(pack.id)}
              isLocked={false}
              characters={packCharacters[pack.id] ?? []}
              loadingChars={loadingCharacters[pack.id] ?? false}
              onToggleExpand={() => togglePackExpansion(pack)}
            />
          ))}
        </View>

        {/* Extended packs */}
        {extendedPacks.length > 0 && (
          <View className="mb-8">
            <Text className="text-slate-300 font-semibold text-sm mb-3">
              Extended Packs — Pro
            </Text>
            {extendedPacks.map((pack) => (
              <PackSection
                key={pack.id}
                pack={pack}
                isExpanded={expandedPackIds.has(pack.id)}
                isLocked={!isPremium}
                characters={packCharacters[pack.id] ?? []}
                loadingChars={loadingCharacters[pack.id] ?? false}
                onToggleExpand={() => {
                  if (!isPremium) { router.push('/paywall'); return; }
                  togglePackExpansion(pack);
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
