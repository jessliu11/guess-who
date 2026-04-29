import React from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { useSubscription } from '../../src/hooks/useSubscription';

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-5 items-center border border-gray-200">
      <Text className="text-navy text-2xl font-bold">{value}</Text>
      <Text className="text-gray-400 text-xs font-medium mt-1 tracking-wider">{label}</Text>
    </View>
  );
}

function MenuRow({
  label,
  iconName,
  iconBg,
  iconColor,
  onPress,
  isLast,
}: {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`flex-row items-center gap-3 py-4 ${!isLast ? 'border-b border-gray-200' : ''}`}
    >
      <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: iconBg }}>
        <Ionicons name={iconName} size={18} color={iconColor} />
      </View>
      <Text className="flex-1 text-navy text-base">{label}</Text>
      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

export default function Profile() {
  const router = useRouter();
  const { profile, signOut, isAnonymous, user } = useAuth();
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

  const initials = (profile?.display_name ?? 'G')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} bounces>
        {/* Gradient header */}
        <LinearGradient
          colors={['#7C3AED', '#C026D3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: 64, paddingBottom: 32, alignItems: 'center', paddingHorizontal: 24 }}
        >
          {/* Avatar */}
          <View style={{
            width: 96, height: 96, borderRadius: 48,
            backgroundColor: 'rgba(255,255,255,0.2)',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 12,
            borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
          }}>
            <Text style={{ color: 'white', fontSize: 36, fontWeight: 'bold' }}>{initials}</Text>
          </View>

          <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', textAlign: 'center', fontFamily: 'Inter_700Bold' }}>
            {profile?.display_name ?? 'Guest Player'}
          </Text>
          {user?.email && (
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 2, textAlign: 'center' }}>
              {user.email}
            </Text>
          )}
          {isAnonymous && (
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 2, textAlign: 'center' }}>
              Guest Account
            </Text>
          )}

          {/* Plan badge */}
          <View style={{
            marginTop: 12, paddingHorizontal: 16, paddingVertical: 6,
            borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
            alignSelf: 'center',
          }}>
            <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5 }}>
              {isPremium ? '⭐ PRO' : 'FREE PLAN'}
            </Text>
          </View>
        </LinearGradient>

        <View className="px-4 pt-6">
          {/* Game Stats */}
          {profile && (
            <View className="mb-6">
              <Text className="text-navy font-bold text-base mb-3">Game Stats</Text>
              <View className="flex-row gap-3">
                <StatBox label="PLAYED" value={profile.games_played} />
                <StatBox label="WON" value={profile.games_won} />
                <StatBox label="WIN RATE" value={`${winRate}%`} />
              </View>
            </View>
          )}

          {/* Menu */}
          <View className="bg-white rounded-2xl px-4 border border-gray-200 mb-4">
            {!isPremium && (
              <MenuRow
                label="Upgrade to Pro"
                iconName="star"
                iconBg="#FEF3C7"
                iconColor="#D97706"
                onPress={() => router.push('/paywall')}
              />
            )}
            {isPremium && (
              <MenuRow
                label="Manage Subscription"
                iconName="card"
                iconBg="#FEF3C7"
                iconColor="#D97706"
                onPress={() => Alert.alert('Subscription', 'Manage in Settings > Apple ID / Google Play.')}
              />
            )}
            <MenuRow
              label="Notifications"
              iconName="notifications-outline"
              iconBg="#F3F4F6"
              iconColor="#6B7280"
              onPress={() => Alert.alert('Coming Soon', 'Notifications will be available soon.')}
            />
            <MenuRow
              label="Help & FAQ"
              iconName="help-circle-outline"
              iconBg="#F3F4F6"
              iconColor="#6B7280"
              onPress={() => Alert.alert('Coming Soon', 'Help & FAQ will be available soon.')}
            />
            <MenuRow
              label="Privacy"
              iconName="shield-outline"
              iconBg="#F3F4F6"
              iconColor="#6B7280"
              onPress={() => Alert.alert('Coming Soon', 'Privacy settings will be available soon.')}
              isLast
            />
          </View>

          {/* Sign Out */}
          <TouchableOpacity
            onPress={handleSignOut}
            activeOpacity={0.7}
            className="bg-white rounded-2xl px-4 py-4 border border-gray-200 mb-8 flex-row items-center justify-center gap-2"
          >
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            <Text className="text-danger font-semibold text-base">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
