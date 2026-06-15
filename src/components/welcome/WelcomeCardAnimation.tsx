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

  // Start the strip centered on screen so cards are visible immediately.
  // Cards that start left of screen-center are pre-eliminated.
  const startX = screenWidth / 2 - TOTAL_CARDS_WIDTH / 2;
  const totalTravel = -startX + TOTAL_CARDS_WIDTH; // distance from startX to -TOTAL_CARDS_WIDTH
  const duration = (totalTravel / SPEED) * 1000;

  const screenCenter = screenWidth / 2;

  // Which cards start already past center (pre-eliminated on first render)
  const preEliminated = new Set(
    MOCK_CHARACTERS.map((_, i) => i).filter((i) => {
      const cardCenter = startX + i * CARD_SLOT + 45;
      return cardCenter < screenCenter && i < MOCK_CHARACTERS.length - 1;
    })
  );

  const translateX = useSharedValue(startX);
  const [cycle, setCycle] = useState(0);
  const [eliminatedSet, setEliminatedSet] = useState<Set<number>>(preEliminated);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  useEffect(() => {
    // Clear pending timers and reset state
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setEliminatedSet(new Set(preEliminated));
    setSelectedIndex(null);

    // Snap scroll back to start (instant)
    translateX.value = startX;

    // Schedule elimination/selection for cards not yet past center
    MOCK_CHARACTERS.forEach((_, i) => {
      const cardCenter = startX + i * CARD_SLOT + 45;
      const travelToCenter = cardCenter - screenCenter;

      // Skip cards that start already past center (pre-eliminated)
      if (travelToCenter <= 0 && i < MOCK_CHARACTERS.length - 1) return;

      const delay = Math.max((travelToCenter / totalTravel) * duration, 100);

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
