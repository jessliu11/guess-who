import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, showBack = true, right }: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <View className="px-4 pt-4 pb-3">
      <View className="flex-row items-center justify-between">
        {showBack ? (
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-white border border-gray-200 items-center justify-center -ml-1"
            activeOpacity={0.7}
          >
            <Text className="text-navy text-base leading-none">‹</Text>
          </TouchableOpacity>
        ) : (
          <View className="w-9" />
        )}
        <View className="w-16 items-end">{right ?? null}</View>
      </View>
      <View className="mt-2">
        <Text className="text-navy text-2xl font-bold">{title}</Text>
        {subtitle ? (
          <Text className="text-gray-500 text-sm mt-0.5">{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}
