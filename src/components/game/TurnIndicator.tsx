import React from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { roundFromTurnCount } from '../../lib/round';

interface TurnIndicatorProps {
  isMyTurn: boolean;
  turnCount: number;
}

export function TurnIndicator({ isMyTurn, turnCount }: TurnIndicatorProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isMyTurn) {
      opacity.value = withRepeat(withTiming(0.4, { duration: 800 }), -1, true);
    } else {
      opacity.value = 1;
    }
  }, [isMyTurn]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View className="flex-row items-center justify-between px-4 py-2 bg-white rounded-xl mb-3 border border-gray-200">
      <View className="flex-row items-center gap-2">
        <Animated.View
          style={animStyle}
          className={`w-3 h-3 rounded-full ${isMyTurn ? 'bg-green-500' : 'bg-gray-300'}`}
        />
        <Text className={`font-semibold text-sm ${isMyTurn ? 'text-green-600' : 'text-gray-400'}`}>
          {isMyTurn ? 'Your Turn' : "Opponent's Turn"}
        </Text>
      </View>
      <Text className="text-gray-400 text-xs">Round {roundFromTurnCount(turnCount)}</Text>
    </View>
  );
}
