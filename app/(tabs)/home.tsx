import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight } from 'lucide-react-native';
import { useAuth } from '../../src/hooks/useAuth';
import { StatCard } from '../../src/components/ui/StatCard';
import { getInitials, getColorForName } from '../../src/lib/avatar';

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();

  const winRate = profile && profile.games_played > 0
    ? Math.round((profile.games_won / profile.games_played) * 100)
    : 0;

  const avatarInitials = profile?.display_name ? getInitials(profile.display_name) : '?';
  const avatarColor = profile?.display_name ? getColorForName(profile.display_name) : '#7C3AED';

  return (
    <View style={{ flex: 1, paddingTop: insets.top }} className="bg-background">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="pt-6 pb-2">
          <Text className="text-navy text-3xl font-bold">Ready to play?</Text>
        </View>

        {/* Action cards */}
        <View className="mt-5 mb-2">
          {/* Host Game */}
          <TouchableOpacity
            onPress={() => router.push('/(game)/setup?mode=host')}
            activeOpacity={0.85}
            className="bg-primary-600 rounded-3xl p-5 flex-row items-center mb-3"
          >
            <View className="flex-1">
              <Text className="text-white text-lg font-bold">Host Game</Text>
              <Text className="text-white/75 text-sm mt-0.5">Pick characters, invite a friend</Text>
            </View>
            <ArrowRight size={20} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>

          {/* Avatar bubble between cards */}
          <View className="items-center" style={{ marginVertical: -16, zIndex: 10 }}>
            <View
              className="w-12 h-12 rounded-full items-center justify-center border-2 border-background"
              style={{ backgroundColor: avatarColor }}
            >
              <Text className="text-white text-base font-bold">{avatarInitials}</Text>
            </View>
          </View>

          {/* Join Game */}
          <TouchableOpacity
            onPress={() => router.push('/(game)/setup?mode=join')}
            activeOpacity={0.85}
            className="bg-white rounded-3xl p-5 flex-row items-center border border-[#E5E0D5]"
          >
            <View className="flex-1">
              <Text className="text-navy text-lg font-bold">Join Game</Text>
              <Text className="text-gray-500 text-sm mt-0.5">Pick characters, invite a friend</Text>
            </View>
            <ArrowRight size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        {profile && (
          <View className="mt-8 mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-navy text-base font-semibold">Your Stats</Text>
              <Text className="text-gray-400 text-sm">All time</Text>
            </View>
            <View className="flex-row gap-3">
              <StatCard value={profile.games_played} label="Played" />
              <StatCard value={profile.games_won} label="Won" />
              <StatCard value={`${winRate}%`} label="Win Rate" />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
