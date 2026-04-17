import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { Button } from '../../src/components/ui/Button';
import { useAuth } from '../../src/hooks/useAuth';
import { createCustomCharacter } from '../../src/lib/characters';

export default function CharacterCreator() {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your photo library to add a character photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access to take a character photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const showImageOptions = () => {
    Alert.alert('Add Photo', undefined, [
      { text: 'Choose from Library', onPress: pickFromLibrary },
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    if (!user || !name.trim() || !imageUri) return;
    setSaving(true);
    try {
      await createCustomCharacter(user.id, name, imageUri);
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not save character.');
    } finally {
      setSaving(false);
    }
  };

  const canSave = !!name.trim() && !!imageUri;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScreenHeader title="Create Character" />
      <ScrollView
        className="flex-1 px-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Photo picker */}
        <View className="items-center mt-8 mb-8">
          <TouchableOpacity
            onPress={showImageOptions}
            activeOpacity={0.8}
            className="w-36 h-36 rounded-full overflow-hidden border-2 border-dashed border-slate-600 bg-surface-card items-center justify-center"
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <View className="items-center gap-1">
                <Text className="text-4xl">📷</Text>
                <Text className="text-slate-500 text-xs text-center px-4">
                  Tap to add photo
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {imageUri && (
            <TouchableOpacity onPress={showImageOptions} className="mt-3">
              <Text className="text-primary-400 text-sm">Change photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Name input */}
        <View className="mb-8">
          <Text className="text-slate-400 text-sm mb-2">Character Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Uncle Bob"
            placeholderTextColor="#64748b"
            maxLength={40}
            returnKeyType="done"
            style={{
              backgroundColor: '#1e293b',
              borderColor: '#334155',
              borderWidth: 1,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              color: '#fff',
              fontSize: 16,
            }}
          />
          <Text className="text-slate-600 text-xs mt-1 text-right">
            {name.length}/40
          </Text>
        </View>

        {saving ? (
          <View className="items-center py-4">
            <ActivityIndicator color="#6471f1" />
            <Text className="text-slate-400 text-sm mt-2">Uploading photo…</Text>
          </View>
        ) : (
          <Button
            title="Save Character"
            size="lg"
            disabled={!canSave}
            onPress={handleSave}
          />
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
