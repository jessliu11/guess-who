import React, { useEffect, useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { CharacterCard } from '../game/CharacterCard';
import type { Character } from '../../types/game.types';

const MOCK_CHARACTERS = [
  { id: '1', name: 'Nina' },
  { id: '2', name: 'Sam' },
  { id: '3', name: 'Diego' },
  { id: '4', name: 'Mia' },
  { id: '5', name: 'Alex' },
  { id: '6', name: 'Faye' },
  { id: '7', name: 'Kit' },
] as const;

const CARD_SLOT = 98; // 90px card + 8px margins
const TOTAL_CARDS_WIDTH = MOCK_CHARACTERS.length * CARD_SLOT;
const SPEED = 80; // px/s

export function WelcomeCardAnimation() {
  const { width: screenWidth } = useWindowDimensions();
  const duration = ((screenWidth + TOTAL_CARDS_WIDTH) / SPEED) * 1000;

  const translateX = useSharedValue(screenWidth);
  const [cycle, setCycle] = useState(0);
  const [eliminatedSet, setEliminatedSet] = useState(new Set<number>());
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  useEffect(() => {
    // Clear pending timers and reset state
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setEliminatedSet(new Set());
    setSelectedIndex(null);

    // Snap scroll back to start (instant)
    translateX.value = screenWidth;

    const totalTravel = screenWidth + TOTAL_CARDS_WIDTH;

    // Schedule elimination/selection for each card as it crosses screen center
    MOCK_CHARACTERS.forEach((_, i) => {
      const cardCenterStart = screenWidth + i * CARD_SLOT + 45;
      const travelToCenter = cardCenterStart - screenWidth / 2;
      const delay = (travelToCenter / totalTravel) * duration;

      const t = setTimeout(() => {
        if (i < MOCK_CHARACTERS.length - 1) {
          setEliminatedSet((prev) => new Set([...prev, i]));
        } else {
          setSelectedIndex(i);
        }
      }, delay);
      timersRef.current.push(t);
    });

    // Start scroll
    translateX.value = withTiming(-TOTAL_CARDS_WIDTH, { duration, easing: Easing.linear }, () => {
      runOnJS(setCycle)((c) => c + 1);
    });

    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, [cycle, screenWidth]);

  // Kick off first cycle on mount
  useEffect(() => {
    setCycle(1);
  }, []);

  return (
    <View style={{ overflow: 'hidden', height: 130, width: '100%' }}>
      <Animated.View
        style={[{ flexDirection: 'row', position: 'absolute', top: 12 }, animatedStyle]}
      >
        {MOCK_CHARACTERS.map((char, i) => (
          <CharacterCard
            key={`${char.id}-${cycle}`}
            character={{ ...char, image_url: null, category_id: '', slug: '', is_active: true, sort_order: i } as Character}
            size="md"
            eliminated={eliminatedSet.has(i)}
            selected={selectedIndex === i}
          />
        ))}
      </Animated.View>
    </View>
  );
}
