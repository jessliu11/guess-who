import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, showBack = true, right }: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
      {showBack ? (
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Text className="text-primary-400 text-base">← Back</Text>
        </TouchableOpacity>
      ) : (
        <View className="w-16" />
      )}
      <Text className="text-white text-lg font-bold">{title}</Text>
      <View className="w-16 items-end">{right ?? null}</View>
    </View>
  );
}
