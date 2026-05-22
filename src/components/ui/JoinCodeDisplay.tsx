import React from 'react';
import { View, Text, TouchableOpacity, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';

interface JoinCodeDisplayProps {
  code: string;
  label?: string;
}

export function JoinCodeDisplay({ code, label = 'Game Code' }: JoinCodeDisplayProps) {
  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
  };

  const handleShare = async () => {
    await Share.share({ message: `Join my Who, What, Where? game! Code: ${code}` });
  };

  const chars = code.split('');

  return (
    <View className="items-center">
      <Text className="text-gray-400 text-sm font-medium mb-3 tracking-widest uppercase">
        {label}
      </Text>
      <View className="flex-row gap-2 mb-4">
        {chars.map((ch, i) => (
          <View
            key={i}
            className="w-12 h-14 bg-white border border-gray-200 rounded-xl items-center justify-center"
          >
            <Text className="text-navy text-2xl font-bold tracking-wider">{ch}</Text>
          </View>
        ))}
      </View>
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={handleCopy}
          className="flex-row items-center gap-1.5 px-4 py-2 bg-gray-100 rounded-xl border border-gray-200"
        >
          <Text className="text-navy text-sm">Copy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleShare}
          className="flex-row items-center gap-1.5 px-4 py-2 bg-primary-600 rounded-xl"
        >
          <Text className="text-white text-sm font-medium">Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
