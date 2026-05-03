import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/hooks/useAuth';
import { useSubscription } from '../../src/hooks/useSubscription';
import { createCustomCharacter, getMyCustomCharacters } from '../../src/lib/characters';
import { supabase } from '../../src/lib/supabase';
import { FREE_CUSTOM_CHARACTER_LIMIT } from '../../src/constants/config';

type QueueItem = { uri: string; name: string };

export default function CharacterCreator() {
  const router = useRouter();
  const { user } = useAuth();
  const { isPremium } = useSubscription();

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [existingCount, setExistingCount] = useState(0);

  useEffect(() => {
    if (user && !isPremium) {
      getMyCustomCharacters(user.id).then((chars) => setExistingCount(chars.length)).catch(() => {});
    }
  }, [user, isPremium]);

  const remainingSlots = isPremium ? Infinity : Math.max(0, FREE_CUSTOM_CHARACTER_LIMIT - existingCount);
  const atCap = !isPremium && remainingSlots <= 0;

  const pickFromLibrary = async () => {
    if (atCap) {
      Alert.alert(
        'Character limit reached',
        `Free accounts can save up to ${FREE_CUSTOM_CHARACTER_LIMIT} custom characters. Upgrade to Pro for unlimited uploads.`,
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Upgrade to Pro', onPress: () => router.push('/paywall') },
        ],
      );
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your photo library to add character photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: isPremium ? 20 : remainingSlots,
      quality: 0.8,
    });
    if (!result.canceled) {
      setQueue((prev) => [
        ...prev,
        ...result.assets.map((a) => ({ uri: a.uri, name: '' })),
      ]);
    }
  };

  const updateName = (index: number, name: string) => {
    setQueue((prev) => prev.map((item, i) => (i === index ? { ...item, name } : item)));
  };

  const removeItem = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveAll = async () => {
    if (!user) return;
    setSaving(true);
    setProgress({ current: 0, total: queue.length });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      Alert.alert('Session expired', 'Please sign in again.');
      setSaving(false);
      setProgress(null);
      return;
    }

    const failedIndices: number[] = [];
    let completed = 0;
    let nextIndex = 0;
    const snapshot = [...queue];

    async function worker() {
      while (nextIndex < snapshot.length) {
        const i = nextIndex++;
        try {
          await createCustomCharacter(user!.id, snapshot[i].name, snapshot[i].uri, session);
        } catch {
          failedIndices.push(i);
        }
        completed++;
        setProgress({ current: completed, total: snapshot.length });
      }
    }

    await Promise.all(Array.from({ length: Math.min(3, snapshot.length) }, worker));

    setSaving(false);
    setProgress(null);
    if (failedIndices.length > 0) {
      setQueue((prev) => prev.filter((_, i) => failedIndices.includes(i)));
      Alert.alert('Some failed', `${failedIndices.length} character(s) could not be saved. Try again.`);
    } else {
      router.back();
    }
  };

  const namedCount = queue.filter((item) => item.name.trim().length > 0).length;
  const canSave = queue.length > 0 && namedCount === queue.length && !saving;

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
          <Text className="text-navy text-xl font-bold">Add Characters</Text>
          {isPremium ? (
            <Text className="text-gray-400 text-xs">Up to 20 photos · name each one</Text>
          ) : (
            <Text className="text-gray-400 text-xs">
              {existingCount} of {FREE_CUSTOM_CHARACTER_LIMIT} slots used
            </Text>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          className="flex-1 px-4 pt-2"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Pick photos card — always visible at top */}
          <TouchableOpacity
            onPress={pickFromLibrary}
            activeOpacity={0.8}
            className="flex-row items-center rounded-2xl p-4 mb-4"
            style={{ borderWidth: 2, borderColor: '#7C3AED', borderStyle: 'dashed', backgroundColor: '#F5F3FF' }}
          >
            <View className="w-11 h-11 rounded-xl bg-primary-600 items-center justify-center mr-3">
              <Ionicons name="images-outline" size={20} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-primary-700 font-semibold text-sm">Pick photos from library</Text>
              <Text className="text-primary-500 text-xs mt-0.5">Select up to 20 at once</Text>
            </View>
            <Ionicons name="add" size={22} color="#7C3AED" />
          </TouchableOpacity>

          {/* Queue */}
          {queue.map((item, index) => {
            const hasName = item.name.trim().length > 0;
            return (
              <View
                key={`${item.uri}-${index}`}
                className="flex-row items-center gap-3 mb-3 bg-white rounded-2xl p-3 border border-gray-200"
              >
                <Image
                  source={{ uri: item.uri }}
                  style={{ width: 56, height: 56, borderRadius: 12 }}
                  resizeMode="cover"
                />
                <TextInput
                  value={item.name}
                  onChangeText={(text) => updateName(index, text)}
                  placeholder="Name this character"
                  placeholderTextColor="#9CA3AF"
                  maxLength={40}
                  returnKeyType="next"
                  style={{
                    flex: 1,
                    backgroundColor: hasName ? '#FAF8F2' : '#FFF5F5',
                    borderColor: hasName ? '#E5E0D5' : '#EF4444',
                    borderWidth: 1.5,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    color: '#1E1B4B',
                    fontSize: 15,
                  }}
                />
                <TouchableOpacity
                  onPress={() => removeItem(index)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  className="w-9 h-9 rounded-xl items-center justify-center"
                  style={{ backgroundColor: hasName ? '#F3F4F6' : '#FEE2E2' }}
                >
                  <Ionicons name="trash-outline" size={16} color={hasName ? '#9CA3AF' : '#EF4444'} />
                </TouchableOpacity>
              </View>
            );
          })}

          {queue.length === 0 && (
            <View className="items-center py-8 gap-2">
              <Text className="text-gray-400 text-sm text-center">
                No photos yet — tap above to add characters
              </Text>
            </View>
          )}

          <View className="h-32" />
        </ScrollView>

        {/* Sticky footer */}
        <View className="bg-background border-t border-gray-200 px-4 pt-3 pb-4 flex-row items-center justify-between">
          <View>
            {saving && progress ? (
              <Text className="text-navy font-semibold text-base">
                Saved {progress.current} of {progress.total}…
              </Text>
            ) : (
              <>
                <Text className="text-navy font-semibold text-base">
                  {namedCount} of {queue.length} named
                </Text>
                <Text className="text-gray-400 text-xs">
                  {canSave ? 'Ready to save!' : 'Name each character to save'}
                </Text>
              </>
            )}
          </View>

          <TouchableOpacity
            onPress={handleSaveAll}
            disabled={!canSave}
            className="flex-row items-center gap-2 px-6 py-3.5 rounded-2xl"
            style={{ backgroundColor: canSave ? '#7C3AED' : '#C4B5FD' }}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark" size={18} color="white" />
                <Text className="text-white font-semibold text-base">Save All</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
