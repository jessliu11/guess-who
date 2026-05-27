import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();

  // win rate is only calculated for users that are logged in
  const winRate = profile && profile.games_played > 0
    ? Math.round((profile.games_won / profile.games_played) * 100)
    : 0;

  return (
    <View style={{ flex: 1, paddingTop: insets.top }} className="bg-background">
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="pt-6 pb-2">
          <Text className="text-navy text-3xl font-bold mt-0.5" style={{ fontFamily: 'Inter_700Bold' }}>Ready to play?</Text>
        </View>

        {/* Action cards */}
        <View className="gap-3 mt-5 mb-6">
          {/* Host Game — solid purple */}
          <TouchableOpacity
            onPress={() => router.push('/(game)/setup?mode=host')}
            activeOpacity={0.85}
            className="bg-primary-600 rounded-2xl p-5 flex-row items-center"
          >
            <View className="w-12 h-12 rounded-xl items-center justify-center mr-4" style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}>
              <Ionicons name="flash" size={22} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-bold">Host Game</Text>
              <Text className="text-white/75 text-sm mt-0.5">Pick characters, invite a friend</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>

          {/* Join Game — white card */}
          <TouchableOpacity
            onPress={() => router.push('/(game)/setup?mode=join')}
            activeOpacity={0.85}
            className="bg-white rounded-2xl p-5 flex-row items-center border border-gray-200"
          >
            <View className="w-12 h-12 rounded-xl items-center justify-center mr-4" style={{ backgroundColor: '#FDE8EC' }}>
              <Ionicons name="log-in-outline" size={22} color="#E11D48" />
            </View>
            <View className="flex-1">
              <Text className="text-navy text-lg font-bold">Join Game</Text>
              <Text className="text-gray-500 text-sm mt-0.5">Enter a 6-letter code from a friend</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        {profile && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-navy text-lg font-bold">Your Stats</Text>
              <Text className="text-gray-400 text-sm">All time</Text>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1 bg-white rounded-2xl p-5 items-center border border-gray-200">
                <Text className="text-navy text-2xl font-bold">{profile.games_played}</Text>
                <Text className="text-gray-400 text-xs font-medium mt-1 tracking-wider">PLAYED</Text>
              </View>
              <View className="flex-1 bg-white rounded-2xl p-5 items-center border border-gray-200">
                <Text className="text-navy text-2xl font-bold">{profile.games_won}</Text>
                <Text className="text-gray-400 text-xs font-medium mt-1 tracking-wider">WON</Text>
              </View>
              <View className="flex-1 bg-white rounded-2xl p-5 items-center border border-gray-200">
                <Text className="text-navy text-2xl font-bold">{winRate}%</Text>
                <Text className="text-gray-400 text-xs font-medium mt-1 tracking-wider">WIN RATE</Text>
              </View>
            </View>
          </View>
        )}

        
      </ScrollView>
    </View>
  );
}
