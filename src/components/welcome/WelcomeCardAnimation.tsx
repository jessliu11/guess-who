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
const TOTAL_CARDS_WIDTH = MOCK_CHARACTERS.length * CARD_SLOT; // 686px
const SPEED = 80; // px/s

export function WelcomeCardAnimation() {
  const { width: screenWidth } = useWindowDimensions();

  const translateX = useSharedValue(0);
  const [eliminatedSet, setEliminatedSet] = useState(new Set<number>());
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [cycleKey, setCycleKey] = useState(0);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Ref so the animation completion callback always calls the latest startCycle
  const startCycleRef = useRef<() => void>(() => {});

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  useEffect(() => {
    // Center the card strip on screen so cards are immediately visible.
    // Cards whose centers already start left of screenCenter are pre-eliminated.
    const startX = screenWidth / 2 - TOTAL_CARDS_WIDTH / 2;
    const screenCenter = screenWidth / 2;
    // Actual pixel travel from startX to -TOTAL_CARDS_WIDTH
    const actualTravel = Math.abs(-TOTAL_CARDS_WIDTH - startX);
    const duration = (actualTravel / SPEED) * 1000;

    const preEliminated = new Set(
      MOCK_CHARACTERS.map((_, i) => i).filter(
        (i) =>
          startX + i * CARD_SLOT + 45 < screenCenter &&
          i < MOCK_CHARACTERS.length - 1,
      ),
    );

    const startCycle = () => {
      // Cancel pending timers from the previous cycle
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];

      // Reset card states and remount cards (cycleKey change clears isFirstRender refs)
      setEliminatedSet(new Set(preEliminated));
      setSelectedIndex(null);
      setCycleKey((k) => k + 1);

      // Snap the strip back to the start position (no animation)
      translateX.value = startX;

      // Schedule each card's elimination/selection as it crosses screen center
      MOCK_CHARACTERS.forEach((_, i) => {
        const cardCenter = startX + i * CARD_SLOT + 45;
        const travelToCenter = cardCenter - screenCenter;

        // Skip cards that are already past center at the start of this cycle
        if (travelToCenter <= 0 && i < MOCK_CHARACTERS.length - 1) return;

        const delay = Math.max((travelToCenter / actualTravel) * duration, 100);

        const t = setTimeout(() => {
          if (i < MOCK_CHARACTERS.length - 1) {
            setEliminatedSet((prev) => new Set([...prev, i]));
          } else {
            setSelectedIndex(i);
          }
        }, delay);
        timersRef.current.push(t);
      });

      // Scroll the strip to the left; loop via ref to avoid passing a function to runOnJS
      translateX.value = withTiming(-TOTAL_CARDS_WIDTH, { duration, easing: Easing.linear }, () => {
        runOnJS(startCycleRef.current)();
      });
    };

    startCycleRef.current = startCycle;
    startCycle();

    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, [screenWidth]);

  return (
    <View style={{ overflow: 'hidden', height: 130, width: '100%' }}>
      <Animated.View
        style={[{ flexDirection: 'row', position: 'absolute', top: 12 }, animatedStyle]}
      >
        {MOCK_CHARACTERS.map((char, i) => (
          <CharacterCard
            key={`${char.id}-${cycleKey}`}
            character={
              {
                ...char,
                image_url: null,
                category_id: '',
                slug: '',
                is_active: true,
                sort_order: i,
              } as Character
            }
            size="md"
            eliminated={eliminatedSet.has(i)}
            selected={selectedIndex === i}
          />
        ))}
      </Animated.View>
    </View>
  );
}
