import React, { useEffect, useRef, useState } from 'react';
import { TouchableOpacity, View, Text, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Check } from 'lucide-react-native';
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
  const imgH = size === 'sm' ? 64 : 80;
  const nameplateH = size === 'sm' ? 22 : 26;
  const textSize = size === 'sm' ? 9 : 11;
  const totalH = imgH + nameplateH;

  const borderStyle = selected
    ? { borderColor: '#7C3AED', borderWidth: 2 }
    : borderColor
    ? { borderColor, borderWidth: 2 }
    : eliminated
    ? { borderColor: 'transparent', borderWidth: 2 }
    : { borderColor: '#E5E0D5', borderWidth: 2 };

  const [imgError, setImgError] = useState(false);

  const isFirstRender = useRef(true);
  const flipProgress = useSharedValue(eliminated ? 1 : 0);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    flipProgress.value = withTiming(eliminated ? 1 : 0, {
      duration: 420,
      easing: Easing.inOut(Easing.ease),
    });
  }, [eliminated]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateY: `${interpolate(flipProgress.value, [0, 1], [0, 180])}deg` },
    ],
    backfaceVisibility: 'hidden',
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateY: `${interpolate(flipProgress.value, [0, 1], [-180, 0])}deg` },
    ],
    backfaceVisibility: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  }));

  const cardFace = (
    <View style={{ height: totalH }}>
      {/* Front face */}
      <Animated.View style={[{ flex: 1, overflow: 'hidden' }, frontStyle]}>
        <View className="flex-1 bg-white">
          {character.image_url && !imgError ? (
            <Image
              source={{ uri: character.image_url }}
              style={{ width: '100%', height: imgH }}
              resizeMode="cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <View
              style={{ width: '100%', height: imgH, alignItems: 'center', justifyContent: 'center', backgroundColor: getColorForName(character.name) }}
            >
              <Text className="text-white font-bold" style={{ fontSize: size === 'sm' ? 22 : 28 }}>
                {getInitials(character.name)}
              </Text>
            </View>
          )}
          {selected && (
            <View className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary-600 items-center justify-center">
              <Check size={10} color="white" strokeWidth={3} />
            </View>
          )}
          <View style={{ height: nameplateH, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
            <Text
              style={{ color: '#0F172A', fontSize: textSize, textAlign: 'center', fontWeight: '500' }}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {character.name}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Back face — revealed when eliminated */}
      <Animated.View style={[{ flex: 1, overflow: 'hidden' }, backStyle]}>
        <View className="flex-1 bg-white opacity-40">
          {character.image_url && !imgError ? (
            <Image
              source={{ uri: character.image_url }}
              style={{ width: '100%', height: imgH }}
              resizeMode="cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <View
              style={{ width: '100%', height: imgH, alignItems: 'center', justifyContent: 'center', backgroundColor: getColorForName(character.name) }}
            >
              <Text className="text-white font-bold" style={{ fontSize: size === 'sm' ? 22 : 28 }}>
                {getInitials(character.name)}
              </Text>
            </View>
          )}
          <View style={{ height: nameplateH, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
            <Text
              style={{ color: '#0F172A', fontSize: textSize, textAlign: 'center', fontWeight: '500' }}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {character.name}
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.75}
      className={`${dim} m-1 rounded-xl overflow-hidden bg-white`}
      style={borderStyle}
    >
      {cardFace}
    </TouchableOpacity>
  );
}
