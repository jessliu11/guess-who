import React, { useEffect, useMemo, useRef, useState } from 'react';
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

// ─── Name pool ────────────────────────────────────────────────────────────────

const NAME_POOL = [
  // Fictional
  'Harry', 'Hermione', 'Ron', 'Gandalf', 'Frodo', 'Katniss', 'Peeta', 'Daenerys',
  'Arya', 'Tyrion', 'Cersei', 'Sherlock', 'Watson', 'Elizabeth', 'Darcy', 'Romeo',
  'Juliet', 'Hamlet', 'Ophelia', 'Atticus', 'Jay Gatsby', 'Huck Finn', 'Holden',
  'Scarlett', 'Rhett', 'Eowyn', 'Legolas', 'Bilbo', 'Dumbledore', 'Voldemort',
  // TV characters
  'Phoebe', 'Monica', 'Rachel', 'Ross', 'Chandler', 'Joey', 'Jesse', 'Walter',
  'Skyler', 'Lorelai', 'Rory', 'Sookie', 'Luke', 'Michael', 'Dwight', 'Jim',
  'Pam', 'Leslie', 'April', 'Ben', 'Fleabag', 'Ted Lasso', 'Nate', 'Keeley',
  'Rebecca', 'Kimmy', 'Titus', 'Moira', 'David', 'Alexis', 'Patrick', 'Schitt',
  // Celebrities
  'Beyoncé', 'Rihanna', 'Taylor', 'Billie', 'Ariana', 'Adele', 'Lizzo',
  'Zendaya', 'Timothée', 'Sydney', 'Florence', 'Harry S', 'Dua Lipa', 'Olivia',
  'Sabrina', 'Chappell', 'SZA', 'Gracie', 'Cardi B', 'Nicki', 'Doja',
  // Countries
  'France', 'Japan', 'Brazil', 'Kenya', 'Iceland', 'Peru', 'Morocco', 'Vietnam',
  'Norway', 'Ghana', 'Egypt', 'Chile', 'Nepal', 'Croatia', 'Jordan', 'Senegal',
  // Historical / iconic
  'Cleopatra', 'Einstein', 'Mozart', 'Frida', 'Picasso', 'Tesla', 'Darwin',
  'Marie Curie', 'Socrates', 'Plato', 'Caesar', 'Napoleon', 'Joan', 'Lincoln',
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Single scrolling row ─────────────────────────────────────────────────────

const CARD_SLOT = 98; // 90px (size="md") + 8px margins

interface RowProps {
  names: string[];
  speed: number; // px/s
}

function CardRow({ names, speed }: RowProps) {
  const { width: screenWidth } = useWindowDimensions();

  const totalCardsWidth = names.length * CARD_SLOT;
  const translateX = useSharedValue(0);
  const [eliminatedSet, setEliminatedSet] = useState(new Set<number>());
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [cycleKey, setCycleKey] = useState(0);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const startCycleRef = useRef<() => void>(() => {});

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  useEffect(() => {
    const startX = screenWidth / 2 - totalCardsWidth / 2;
    const screenCenter = screenWidth / 2;
    const actualTravel = Math.abs(-totalCardsWidth - startX);
    const duration = (actualTravel / speed) * 1000;

    const preEliminated = new Set(
      names.map((_, i) => i).filter(
        (i) => startX + i * CARD_SLOT + 45 < screenCenter && i < names.length - 1,
      ),
    );

    const scheduleAnimation = () => {
      names.forEach((_, i) => {
        const cardCenter = startX + i * CARD_SLOT + 45;
        const travelToCenter = cardCenter - screenCenter;
        if (travelToCenter <= 0 && i < names.length - 1) return;

        const delay = Math.max((travelToCenter / actualTravel) * duration, 100);
        const t = setTimeout(() => {
          if (i < names.length - 1) {
            setEliminatedSet((prev) => new Set([...prev, i]));
          } else {
            setSelectedIndex(i);
          }
        }, delay);
        timersRef.current.push(t);
      });

      translateX.value = withTiming(-totalCardsWidth, { duration, easing: Easing.linear }, () => {
        runOnJS(startCycleRef.current)();
      });
    };

    const startCycle = () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];

      // Reset state while cards are still off-screen (translateX = -totalCardsWidth).
      // Remount happens invisibly; then snap into the start position and animate.
      setEliminatedSet(new Set(preEliminated));
      setSelectedIndex(null);
      setCycleKey((k) => k + 1);

      // Wait two frames for React to remount the cards off-screen, then snap & go.
      const snapTimer = setTimeout(() => {
        translateX.value = startX;
        scheduleAnimation();
      }, 32);
      timersRef.current.push(snapTimer);
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
        {names.map((name, i) => (
          <CharacterCard
            key={`${name}-${i}-${cycleKey}`}
            character={{ id: `${i}`, name, image_url: null, category_id: '', slug: '', is_active: true, sort_order: i } as Character}
            size="md"
            eliminated={eliminatedSet.has(i)}
            selected={selectedIndex === i}
          />
        ))}
      </Animated.View>
    </View>
  );
}

// ─── Multi-row export ─────────────────────────────────────────────────────────

const ROW_CONFIGS = [
  { count: 8, speed: 62 },
  { count: 6, speed: 95 },
  { count: 7, speed: 74 },
];

export function WelcomeCardAnimation() {
  // Randomize once on mount — stable across re-renders
  const rows = useMemo(() => {
    const pool = shuffle(NAME_POOL);
    let offset = 0;
    return ROW_CONFIGS.map(({ count, speed }) => {
      const names = pool.slice(offset, offset + count);
      offset += count;
      return { names, speed };
    });
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'space-evenly' }}>
      {rows.map((row, i) => (
        <CardRow key={i} names={row.names} speed={row.speed} />
      ))}
    </View>
  );
}
