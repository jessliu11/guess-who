import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';

function ActionCard({
  emoji,
  title,
  description,
  gradient,
  onPress,
}: {
  emoji: string;
  title: string;
  description: string;
  gradient: [string, string];
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} className="flex-1">
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-2xl p-5 h-40 justify-between"
      >
        <Text className="text-4xl">{emoji}</Text>
        <View>
          <Text className="text-white text-xl font-bold">{title}</Text>
          <Text className="text-white/70 text-xs mt-0.5">{description}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function Home() {
  const router = useRouter();
  const { profile } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="pt-6 pb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-slate-400 text-sm">Welcome back,</Text>
            <Text className="text-white text-2xl font-bold">
              {profile?.display_name ?? 'Player'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            className="w-11 h-11 bg-surface-card rounded-full items-center justify-center border border-slate-700"
          >
            <Text className="text-lg">👤</Text>
          </TouchableOpacity>
        </View>

        {/* Action cards */}
        <View className="flex-row gap-3 mb-6">
          <ActionCard
            emoji="🎯"
            title="Host Game"
            description="Create a session & invite a friend"
            gradient={['#4040ca', '#6471f1']}
            onPress={() => router.push('/(game)/setup?mode=host')}
          />
          <ActionCard
            emoji="🔗"
            title="Join Game"
            description="Enter a code to join"
            gradient={['#065f46', '#059669']}
            onPress={() => router.push('/(game)/setup?mode=join')}
          />
        </View>

        {/* Stats */}
        {profile && (
          <View className="bg-surface-card rounded-2xl p-4 border border-slate-700 mb-6">
            <Text className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">
              Your Stats
            </Text>
            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-white text-2xl font-bold">{profile.games_played}</Text>
                <Text className="text-slate-500 text-xs mt-0.5">Played</Text>
              </View>
              <View className="w-px bg-slate-700" />
              <View className="items-center">
                <Text className="text-white text-2xl font-bold">{profile.games_won}</Text>
                <Text className="text-slate-500 text-xs mt-0.5">Won</Text>
              </View>
              <View className="w-px bg-slate-700" />
              <View className="items-center">
                <Text className="text-white text-2xl font-bold">
                  {profile.games_played > 0
                    ? Math.round((profile.games_won / profile.games_played) * 100)
                    : 0}%
                </Text>
                <Text className="text-slate-500 text-xs mt-0.5">Win Rate</Text>
              </View>
            </View>
          </View>
        )}

        {/* Hint */}
        <View className="bg-primary-950 rounded-2xl p-4 border border-primary-900 mb-8">
          <Text className="text-primary-300 text-sm font-medium mb-1">💡 Tip</Text>
          <Text className="text-slate-400 text-xs leading-relaxed">
            Call or video chat your friend while you play — whoever guesses the other player's character first wins!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
