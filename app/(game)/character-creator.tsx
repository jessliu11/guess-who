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
import { ChevronLeft, Camera, UserRound, X, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuth } from '../../src/hooks/useAuth';
import { useSubscription } from '../../src/hooks/useSubscription';
import { createCustomCharacter, getMyCustomCharacters } from '../../src/lib/characters';
import { supabase } from '../../src/lib/supabase';
import { getInitials, getColorForName } from '../../src/lib/avatar';
import { FREE_CUSTOM_CHARACTER_LIMIT } from '../../src/constants/config';

type QueueItem = { uri: string | null; name: string };
type AddMode = 'photos' | 'name';

async function compressImage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 800 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}

export default function CharacterCreator() {
  const router = useRouter();
  const { user } = useAuth();
  const { isPremium } = useSubscription();

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [existingCount, setExistingCount] = useState(0);
  const [mode, setMode] = useState<AddMode>('photos');

  useEffect(() => {
    if (user && !isPremium) {
      getMyCustomCharacters(user.id).then((chars) => setExistingCount(chars.length)).catch(() => {});
    }
  }, [user, isPremium]);

  const totalSlots = isPremium ? Infinity : FREE_CUSTOM_CHARACTER_LIMIT;
  const remainingSlots = isPremium ? Infinity : Math.max(0, FREE_CUSTOM_CHARACTER_LIMIT - existingCount);
  const atCap = !isPremium && remainingSlots <= 0;

  const checkCap = () => {
    if (!atCap) return true;
    Alert.alert(
      'Character limit reached',
      `Free accounts can save up to ${FREE_CUSTOM_CHARACTER_LIMIT} custom characters. Upgrade to Pro for unlimited.`,
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Upgrade to Pro', onPress: () => router.push('/paywall') },
      ],
    );
    return false;
  };

  const handleAddPhotos = async () => {
    if (!checkCap()) return;
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
        ...result.assets.map((a) => ({ uri: a.uri as string | null, name: '' })),
      ]);
    }
  };

  const handleAddByName = () => {
    if (!checkCap()) return;
    setQueue((prev) => [...prev, { uri: null, name: '' }]);
  };

  const onModePress = (next: AddMode) => {
    setMode(next);
    if (next === 'photos') handleAddPhotos();
    else handleAddByName();
  };

  const updateName = (index: number, name: string) => {
    setQueue((prev) => prev.map((item, i) => (i === index ? { ...item, name } : item)));
  };

  const removeItem = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  };

  const namedItems = queue.filter((item) => item.name.trim().length > 0);
  const namedCount = namedItems.length;
  const unnamedCount = queue.length - namedCount;
  const canSave = namedCount > 0 && !saving;

  const handleSave = async () => {
    if (!user || !canSave) return;
    // Only save named items — discard unnamed
    const toSave = queue.filter((item) => item.name.trim().length > 0);
    setSaving(true);
    setProgress({ current: 0, total: toSave.length });

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

    async function worker() {
      while (nextIndex < toSave.length) {
        const i = nextIndex++;
        try {
          const uri = toSave[i].uri;
          const compressedUri = uri ? await compressImage(uri) : null;
          await createCustomCharacter(user!.id, toSave[i].name, compressedUri, session);
        } catch {
          failedIndices.push(i);
        }
        completed++;
        setProgress({ current: completed, total: toSave.length });
      }
    }

    await Promise.all(Array.from({ length: Math.min(3, toSave.length) }, worker));

    setSaving(false);
    setProgress(null);
    if (failedIndices.length > 0) {
      Alert.alert('Some failed', `${failedIndices.length} character(s) could not be saved. Try again.`);
    } else {
      router.back();
    }
  };

  const slotsLabel = isPremium
    ? undefined
    : `${remainingSlots} of your ${totalSlots} slots left`;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-2 pb-2">
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={24} color="#1E1B4B" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-1 px-5"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text className="text-navy text-2xl font-bold mt-1">Add characters</Text>
          {slotsLabel && (
            <Text className="text-gray-400 text-sm mt-0.5 mb-4">{slotsLabel}</Text>
          )}

          {/* Mode toggle */}
          <View className="flex-row gap-2 mb-5 mt-3">
            <TouchableOpacity
              onPress={() => onModePress('photos')}
              className={`flex-row items-center gap-2 px-4 py-2.5 rounded-full ${mode === 'photos' ? 'bg-primary-600' : 'bg-white border border-[#E5E0D5]'}`}
            >
              <Camera size={15} color={mode === 'photos' ? 'white' : '#6B7280'} />
              <Text className={`text-sm font-semibold ${mode === 'photos' ? 'text-white' : 'text-gray-500'}`}>
                Add photos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onModePress('name')}
              className={`flex-row items-center gap-2 px-4 py-2.5 rounded-full ${mode === 'name' ? 'bg-primary-600' : 'bg-white border border-[#E5E0D5]'}`}
            >
              <UserRound size={15} color={mode === 'name' ? 'white' : '#6B7280'} />
              <Text className={`text-sm font-semibold ${mode === 'name' ? 'text-white' : 'text-gray-500'}`}>
                Add by name
              </Text>
            </TouchableOpacity>
          </View>

          {/* Queue */}
          {queue.length > 0 && (
            <View className="bg-white rounded-2xl border border-[#E5E0D5] overflow-hidden">
              {queue.map((item, index) => (
                <View
                  key={`${item.uri ?? 'no-photo'}-${index}`}
                  className="flex-row items-center px-3 py-2.5 border-b border-[#F0EDE6]"
                >
                  {/* Thumbnail / Initials */}
                  {item.uri ? (
                    <Image
                      source={{ uri: item.uri }}
                      style={{ width: 44, height: 44, borderRadius: 10, marginRight: 12 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        marginRight: 12,
                        backgroundColor: getColorForName(item.name || '?'),
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                        {item.name ? getInitials(item.name) : '?'}
                      </Text>
                    </View>
                  )}
                  {/* Name input */}
                  <TextInput
                    value={item.name}
                    onChangeText={(text) => updateName(index, text)}
                    placeholder="Name this character"
                    placeholderTextColor="#9CA3AF"
                    maxLength={40}
                    returnKeyType="next"
                    className="flex-1 text-navy text-sm font-sans"
                  />
                  {/* Remove */}
                  <TouchableOpacity
                    onPress={() => removeItem(index)}
                    hitSlop={8}
                    className="ml-2"
                  >
                    <X size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {queue.length === 0 && (
            <View className="items-center py-10">
              <Text className="text-gray-400 text-sm text-center">
                Use the buttons above to add characters
              </Text>
            </View>
          )}

          <View className="h-32" />
        </ScrollView>

        {/* Sticky footer */}
        {queue.length > 0 && (
          <View className="bg-background border-t border-[#E5E0D5] px-5 pt-3 pb-4 flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              {saving && progress ? (
                <Text className="text-navy font-semibold text-sm">
                  Saved {progress.current} of {progress.total}…
                </Text>
              ) : (
                <>
                  <Text className="text-navy font-semibold text-sm">
                    {namedCount} of {queue.length} named
                  </Text>
                  {unnamedCount > 0 && (
                    <Text className="text-gray-400 text-xs mt-0.5">
                      {unnamedCount} still need a name — they&apos;ll stay here
                    </Text>
                  )}
                </>
              )}
            </View>

            <TouchableOpacity
              onPress={handleSave}
              disabled={!canSave}
              className="flex-row items-center gap-1.5 px-5 py-3 rounded-full"
              style={{ backgroundColor: canSave ? '#7C3AED' : '#C4B5FD' }}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Check size={16} color="white" strokeWidth={2.5} />
                  <Text className="text-white font-semibold text-sm">Save {namedCount}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
