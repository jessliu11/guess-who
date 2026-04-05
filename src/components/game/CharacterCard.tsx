import React from 'react';
import { TouchableOpacity, View, Text, Image } from 'react-native';
import type { Character } from '../../types/game.types';

interface CharacterCardProps {
  character: Character;
  eliminated?: boolean;
  selected?: boolean;
  onPress?: () => void;
  size?: 'sm' | 'md';
}

export function CharacterCard({
  character,
  eliminated = false,
  selected = false,
  onPress,
  size = 'sm',
}: CharacterCardProps) {
  const dim = size === 'sm' ? 'w-[72px]' : 'w-[90px]';
  const imgH = size === 'sm' ? 'h-16' : 'h-20';
  const textSize = size === 'sm' ? 'text-[9px]' : 'text-[11px]';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.75}
      className={`${dim} m-1 rounded-xl overflow-hidden border-2 ${
        selected
          ? 'border-primary-500'
          : eliminated
          ? 'border-transparent'
          : 'border-surface-elevated'
      }`}
    >
      <View className={`bg-surface-card ${eliminated ? 'opacity-30' : ''}`}>
        <Image
          source={{ uri: character.image_url }}
          className={`w-full ${imgH}`}
          resizeMode="cover"
        />
        {eliminated && (
          <View className="absolute inset-0 items-center justify-center">
            <Text className="text-white/80 text-2xl font-bold">✕</Text>
          </View>
        )}
        <View className="px-1 py-1 bg-surface-elevated">
          <Text
            className={`text-white ${textSize} text-center font-medium`}
            numberOfLines={1}
          >
            {character.name}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
