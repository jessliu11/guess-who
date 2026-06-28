import React, { useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { XCircle } from 'lucide-react-native';
import { CharacterImage } from './CharacterImage';
import type { Character } from '../../types/game.types';

interface WrongGuessModalProps {
  visible: boolean;
  character: Character | null;
  onDismiss: () => void;
}

export function WrongGuessModal({ visible, character, onDismiss }: WrongGuessModalProps) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onDismiss, 2500);
    return () => clearTimeout(timer);
  }, [visible, onDismiss]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <TouchableOpacity
        className="flex-1 bg-black/60 items-center justify-end pb-12 px-6"
        activeOpacity={1}
        onPress={onDismiss}
      >
        <View className="bg-white rounded-3xl p-8 w-full items-center border border-gray-200">
          <View className="w-16 h-16 rounded-2xl bg-red-100 items-center justify-center mb-3">
            <XCircle size={32} color="#EF4444" strokeWidth={1.5} />
          </View>
          <Text className="text-navy text-3xl font-bold mb-1">Wrong Guess!</Text>
          {character && (
            <View className="items-center mt-4">
              <CharacterImage
                name={character.name}
                imageUrl={character.image_url}
                className="w-20 h-20 rounded-2xl mb-2"
                initialsFontSize={32}
              />
              <Text className="text-gray-500 text-sm text-center">
                <Text className="font-semibold text-navy">{character.name}</Text>
                {' '}isn&apos;t their character.
              </Text>
            </View>
          )}
          <Text className="text-gray-400 text-xs mt-4">Tap anywhere to dismiss</Text>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
