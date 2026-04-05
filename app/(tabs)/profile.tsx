import React from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { useSubscription } from '../../src/hooks/useSubscription';

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <View className="flex-row justify-between items-center py-3 border-b border-slate-700">
      <Text className="text-slate-400 text-sm">{label}</Text>
      <Text className="text-white font-semibold">{value}</Text>
    </View>
  );
}

function MenuRow({
  label,
  emoji,
  onPress,
  destructive,
}: {
  label: string;
  emoji: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center gap-3 py-4 border-b border-slate-700"
    >
      <Text className="text-xl">{emoji}</Text>
      <Text className={`flex-1 text-base ${destructive ? 'text-red-400' : 'text-slate-200'}`}>
        {label}
      </Text>
      <Text className="text-slate-600">›</Text>
    </TouchableOpacity>
  );
}

export default function Profile() {
  const router = useRouter();
  const { profile, signOut, isAnonymous } = useAuth();
  const { isPremium } = useSubscription();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const winRate =
    profile && profile.games_played > 0
      ? Math.round((profile.games_won / profile.games_played) * 100)
      : 0;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Avatar + name */}
        <View className="items-center pt-8 pb-6">
          <View className="w-20 h-20 bg-primary-800 rounded-full items-center justify-center mb-3">
            <Text className="text-4xl">👤</Text>
          </View>
          <Text className="text-white text-xl font-bold">
            {profile?.display_name ?? 'Guest Player'}
          </Text>
          {isAnonymous && (
            <Text className="text-slate-500 text-xs mt-1">Guest Account</Text>
          )}
          <View
            className={`mt-2 px-3 py-1 rounded-full ${
              isPremium ? 'bg-accent/20 border border-accent/40' : 'bg-surface-card border border-slate-700'
            }`}
          >
            <Text className={`text-xs font-semibold ${isPremium ? 'text-accent' : 'text-slate-400'}`}>
              {isPremium ? '⭐ Guess Who Pro' : 'Free Plan'}
            </Text>
          </View>
        </View>

        {/* Stats */}
        {profile && (
          <View className="bg-surface-card rounded-2xl px-4 mb-6 border border-slate-700">
            <StatRow label="Games Played" value={profile.games_played} />
            <StatRow label="Games Won" value={profile.games_won} />
            <StatRow label="Win Rate" value={`${winRate}%`} />
          </View>
        )}

        {/* Premium upsell */}
        {!isPremium && (
          <TouchableOpacity
            onPress={() => router.push('/paywall')}
            className="bg-primary-950 border border-primary-700 rounded-2xl p-4 mb-6 flex-row items-center gap-3"
          >
            <Text className="text-2xl">⭐</Text>
            <View className="flex-1">
              <Text className="text-white font-semibold text-sm">Upgrade to Pro</Text>
              <Text className="text-slate-400 text-xs mt-0.5">
                Build custom packs & unlock the extended pool
              </Text>
            </View>
            <Text className="text-primary-400 font-bold">›</Text>
          </TouchableOpacity>
        )}

        {/* Menu */}
        <View className="bg-surface-card rounded-2xl px-4 border border-slate-700 mb-6">
          {isPremium && (
            <MenuRow
              label="Manage Subscription"
              emoji="💳"
              onPress={() => Alert.alert('Subscription', 'Manage in Settings > Apple ID / Google Play.')}
            />
          )}
          {!isPremium && (
            <MenuRow label="Upgrade to Pro" emoji="⭐" onPress={() => router.push('/paywall')} />
          )}
          <MenuRow label="Restore Purchases" emoji="🔄" onPress={() => Alert.alert('Restore', 'Checking purchases...')} />
          <MenuRow label="Sign Out" emoji="🚪" onPress={handleSignOut} destructive />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
