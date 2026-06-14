import React from 'react';
import { View, Text } from 'react-native';

interface StatCardProps {
  value: string | number;
  label: string;
}

export function StatCard({ value, label }: StatCardProps) {
  return (
    <View className="flex-1 bg-white rounded-2xl py-4 px-2 items-center border border-[#E5E0D5]">
      <Text className="text-2xl font-bold text-navy">{value}</Text>
      <Text className="text-xs font-medium text-gray-400 uppercase tracking-wide mt-0.5">{label}</Text>
    </View>
  );
}
