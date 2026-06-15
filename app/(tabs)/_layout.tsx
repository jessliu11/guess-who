import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { Play, Grid2X2, User } from 'lucide-react-native';

const TABS = [
  { name: 'home', label: 'Play', Icon: Play },
  { name: 'packs', label: 'Packs', Icon: Grid2X2 },
  { name: 'profile', label: 'Profile', Icon: User },
];

const INDICATOR_W = 20;
const ACTIVE_COLOR = '#7C3AED';
const INACTIVE_COLOR = '#9CA3AF';

function AnimatedTabBar({ state, navigation }: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  const tabWidth = width / TABS.length;

  const indicatorX = useSharedValue(state.index * tabWidth + tabWidth / 2 - INDICATOR_W / 2);

  useEffect(() => {
    indicatorX.value = withSpring(state.index * tabWidth + tabWidth / 2 - INDICATOR_W / 2, {
      damping: 22,
      stiffness: 220,
      mass: 0.8,
    });
  }, [state.index, tabWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderTopColor: '#E5E0D5',
        borderTopWidth: 1,
        height: 76,
        paddingBottom: 16,
        paddingTop: 8,
        flexDirection: 'row',
      }}
    >
      {/* Single sliding indicator */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            width: INDICATOR_W,
            height: 3,
            borderRadius: 2,
            backgroundColor: ACTIVE_COLOR,
          },
          indicatorStyle,
        ]}
      />

      {TABS.map((tab, index) => {
        const focused = state.index === index;
        const color = focused ? ACTIVE_COLOR : INACTIVE_COLOR;

        return (
          <TouchableOpacity
            key={tab.name}
            onPress={() => navigation.navigate(tab.name)}
            activeOpacity={0.8}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <tab.Icon size={24} color={color} />
            <Text
              style={{
                fontSize: 11,
                fontWeight: '600',
                fontFamily: 'Poppins_600SemiBold',
                marginTop: 2,
                color,
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    />
  );
}
