import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, showBack = true, right }: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <View className="px-5 pt-4 pb-3">
      <View className="flex-row items-center justify-between">
        {showBack ? (
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <ChevronLeft size={24} color="#1E1B4B" />
          </TouchableOpacity>
        ) : (
          <View className="w-6" />
        )}
        <View className="flex-1 items-end">{right ?? null}</View>
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
