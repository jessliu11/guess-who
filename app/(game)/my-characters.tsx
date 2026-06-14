import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronLeft, Plus, Info, Pencil, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuth } from '../../src/hooks/useAuth';
import { getMyCustomCharacters, updateCustomCharacter, deleteCustomCharacter } from '../../src/lib/characters';
import { CharacterImage } from '../../src/components/game/CharacterImage';
import { ConfirmModal } from '../../src/components/ui/ConfirmModal';
import type { Character } from '../../src/types/game.types';

export default function MyCharacters() {
  const router = useRouter();
  const { user } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [editName, setEditName] = useState('');
  const [editImageUri, setEditImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Character | null>(null);

  const loadCharacters = async () => {
    if (!user) return;
    try {
      const chars = await getMyCustomCharacters(user.id);
      setCharacters(chars);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadCharacters(); }, [user]));

  const openEdit = (character: Character) => {
    if (isDeleteMode) return;
    setEditingCharacter(character);
    setEditName(character.name);
    setEditImageUri(null);
  };

  const pickNewImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 800 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );
      setEditImageUri(manipulated.uri);
    }
  };

  const handleSave = async () => {
    if (!editingCharacter || !user || !editName.trim()) return;
    setSaving(true);
    try {
      await updateCustomCharacter(editingCharacter.id, user.id, editName, editImageUri);
      await loadCharacters();
      setEditingCharacter(null);
    } catch (err) {
      Alert.alert('Error', 'Failed to save character. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !user) return;
    try {
      await deleteCustomCharacter(deleteTarget.id, user.id);
      setCharacters((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    } catch {
      Alert.alert('Error', 'Failed to delete character.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const currentImage = editImageUri ?? editingCharacter?.image_url ?? null;

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
      <View className="flex-row items-center justify-between px-5 pt-2 pb-4">
        <TouchableOpacity onPress={() => { setIsDeleteMode(false); router.back(); }} activeOpacity={0.7}>
          <ChevronLeft size={24} color="#1E1B4B" />
        </TouchableOpacity>
        {isDeleteMode ? (
          <TouchableOpacity
            onPress={() => setIsDeleteMode(false)}
            className="bg-primary-600 px-4 py-1.5 rounded-full"
          >
            <Text className="text-white text-sm font-semibold">Done</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => router.push('/(game)/character-creator' as any)}
            className="bg-primary-600 px-4 py-1.5 rounded-full flex-row items-center gap-1.5"
          >
            <Plus size={14} color="white" />
            <Text className="text-white text-sm font-semibold">Create</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text className="text-navy text-2xl font-bold">My characters ({characters.length})</Text>
        <View className="flex-row items-center gap-1.5 mt-1 mb-5">
          <Info size={13} color="#9CA3AF" />
          <Text className="text-gray-400 text-sm">Tap to edit · Long press to remove</Text>
        </View>

        {/* Character Grid */}
        <View className="flex-row flex-wrap">
          {characters.map((character) => (
            <TouchableOpacity
              key={character.id}
              onPress={() => openEdit(character)}
              onLongPress={() => setIsDeleteMode(true)}
              activeOpacity={0.8}
              style={{ width: '23%', margin: '1%', position: 'relative' }}
            >
              <View className="rounded-xl overflow-hidden">
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
              {isDeleteMode && (
                <TouchableOpacity
                  onPress={() => setDeleteTarget(character)}
                  style={{ position: 'absolute', top: -5, right: -5, zIndex: 10 }}
                  hitSlop={6}
                >
                  <View className="w-5 h-5 rounded-full bg-primary-600 items-center justify-center border-2 border-background">
                    <X size={10} color="white" strokeWidth={3} />
                  </View>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Edit Character Modal */}
      <Modal
        visible={editingCharacter !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingCharacter(null)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 items-center justify-center px-6"
          activeOpacity={1}
          onPress={() => setEditingCharacter(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            className="bg-white rounded-3xl p-6 w-full"
            onPress={() => {}}
          >
            <Text className="text-navy text-lg font-bold text-center mb-4">Edit Character</Text>

            {/* Name input */}
            <View className="bg-[#F5F5F5] rounded-2xl px-4 py-3 mb-4">
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="Character name"
                placeholderTextColor="#9CA3AF"
                className="text-navy text-base font-sans"
                autoCapitalize="words"
              />
            </View>

            {/* Image with edit overlay */}
            <TouchableOpacity onPress={pickNewImage} activeOpacity={0.85} className="self-center mb-5">
              <View className="w-24 h-24 rounded-2xl overflow-hidden">
                {currentImage ? (
                  <Image source={{ uri: currentImage }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <View className="w-full h-full bg-gray-100 items-center justify-center">
                    <Text className="text-gray-400 text-xs text-center">No image</Text>
                  </View>
                )}
                <View
                  className="absolute inset-0 items-center justify-center"
                  style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                >
                  <Pencil size={20} color="white" />
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving || !editName.trim()}
              className="bg-primary-600 rounded-full py-3.5 items-center mb-3"
              style={{ opacity: saving || !editName.trim() ? 0.5 : 1 }}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">Save</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setEditingCharacter(null)}
              className="bg-white border border-[#E5E0D5] rounded-full py-3.5 items-center"
            >
              <Text className="text-navy font-semibold text-base">Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        visible={deleteTarget !== null}
        title="Remove character?"
        message={`"${deleteTarget?.name}" will be permanently deleted.`}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </SafeAreaView>
  );
}
