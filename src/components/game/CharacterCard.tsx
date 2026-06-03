import React from 'react';
import { TouchableOpacity, View, Text, Image } from 'react-native';
import type { Character } from '../../types/game.types';
import { getInitials, getColorForName } from '../../lib/avatar';

interface CharacterCardProps {
  character: Character;
  eliminated?: boolean;
  selected?: boolean;
  onPress?: () => void;
  size?: 'sm' | 'md';
  borderColor?: string;
}

export function CharacterCard({
  character,
  eliminated = false,
  selected = false,
  onPress,
  size = 'sm',
  borderColor,
}: CharacterCardProps) {
  const dim = size === 'sm' ? 'w-[72px]' : 'w-[90px]';
  const imgH = size === 'sm' ? 'h-16' : 'h-20';
  const textSize = size === 'sm' ? 'text-[9px]' : 'text-[11px]';
  const nameplateH = size === 'sm' ? 'h-[22px]' : 'h-[26px]';

  const borderStyle = selected
    ? { borderColor: '#7C3AED', borderWidth: 2 }
    : borderColor
    ? { borderColor, borderWidth: 2 }
    : eliminated
    ? { borderColor: 'transparent', borderWidth: 2 }
    : { borderColor: '#E5E0D5', borderWidth: 2 };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.75}
      className={`${dim} m-1 rounded-xl overflow-hidden`}
      style={borderStyle}
    >
      <View className={`bg-white ${eliminated ? 'opacity-30' : ''}`}>
        {character.image_url ? (
          <Image
            source={{ uri: character.image_url }}
            className={`w-full ${imgH}`}
            resizeMode="cover"
          />
        ) : (
          <View
            className={`w-full ${imgH} items-center justify-center`}
            style={{ backgroundColor: getColorForName(character.name) }}
          >
            <Text className="text-white font-bold" style={{ fontSize: size === 'sm' ? 22 : 28 }}>
              {getInitials(character.name)}
            </Text>
          </View>
        )}
        {eliminated && (
          <View className="absolute inset-0 items-center justify-center">
            <Text className="text-gray-600 text-2xl font-bold">✕</Text>
          </View>
        )}
        {selected && (
          <View className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary-600 items-center justify-center">
            <Text className="text-white text-[10px] font-bold">✓</Text>
          </View>
        )}
        <View className={`px-1 ${nameplateH} bg-gray-50 items-center justify-center`}>
          <Text
            className={`text-navy ${textSize} text-center font-medium`}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {character.name}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
