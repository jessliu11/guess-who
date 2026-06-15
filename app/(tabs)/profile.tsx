import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, CreditCard, Bell, HelpCircle, Shield, LogOut, ChevronRight } from 'lucide-react-native';
import { useAuth } from '../../src/hooks/useAuth';
import { useSubscription } from '../../src/hooks/useSubscription';
import { StatCard } from '../../src/components/ui/StatCard';
import { ConfirmModal } from '../../src/components/ui/ConfirmModal';
import { Button } from '../../src/components/ui/Button';

type MenuRowIcon = typeof Star;

function MenuRow({
  label,
  Icon,
  iconBg,
  iconColor,
  onPress,
  isLast,
}: {
  label: string;
  Icon: MenuRowIcon;
  iconBg: string;
  iconColor: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`flex-row items-center gap-3 py-4 ${!isLast ? 'border-b border-[#E5E0D5]' : ''}`}
    >
      <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: iconBg }}>
        <Icon size={18} color={iconColor} />
      </View>
      <Text className="flex-1 text-navy text-base">{label}</Text>
      <ChevronRight size={16} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

interface InfoState { title: string; message: string }

export default function Profile() {
  const router = useRouter();
  const { profile, signOut, isAnonymous, user } = useAuth();
  const { isPremium } = useSubscription();
  const [signOutVisible, setSignOutVisible] = useState(false);
  const [info, setInfo] = useState<InfoState | null>(null);

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
          <View style={{
            width: 96, height: 96, borderRadius: 48,
            backgroundColor: 'rgba(255,255,255,0.2)',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 12,
            borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
          }}>
            <Text style={{ color: 'white', fontSize: 36, fontWeight: 'bold', fontFamily: 'Poppins_700Bold' }}>{initials}</Text>
          </View>

          <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', textAlign: 'center', fontFamily: 'Poppins_700Bold' }}>
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

          <View style={{
            marginTop: 12, paddingHorizontal: 16, paddingVertical: 6,
            borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
            alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 4,
          }}>
            {isPremium && <Star size={11} color="white" fill="white" />}
            <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5 }}>
              {isPremium ? 'PRO' : 'FREE PLAN'}
            </Text>
          </View>
        </LinearGradient>

        <View className="px-4 pt-6">
          {/* Stats */}
          {profile && (
            <View className="mb-6">
              <Text className="text-navy font-bold text-base mb-3">Game Stats</Text>
              <View className="flex-row gap-3">
                <StatCard value={profile.games_played} label="Played" />
                <StatCard value={profile.games_won} label="Won" />
                <StatCard value={`${winRate}%`} label="Win Rate" />
              </View>
            </View>
          )}

          {/* Menu */}
          <View className="bg-white rounded-2xl px-4 border border-[#E5E0D5] mb-4">
            {!isPremium && (
              <MenuRow label="Upgrade to Pro" Icon={Star} iconBg="#FEF3C7" iconColor="#D97706" onPress={() => router.push('/paywall')} />
            )}
            {isPremium && (
              <MenuRow
                label="Manage Subscription"
                Icon={CreditCard}
                iconBg="#FEF3C7"
                iconColor="#D97706"
                onPress={() => setInfo({ title: 'Manage Subscription', message: 'To manage or cancel your subscription, go to Settings > Apple ID > Subscriptions on your device.' })}
              />
            )}
            <MenuRow
              label="Notifications"
              Icon={Bell}
              iconBg="#F3F4F6"
              iconColor="#6B7280"
              onPress={() => setInfo({ title: 'Coming Soon', message: 'Notification preferences will be available in a future update.' })}
            />
            <MenuRow
              label="Help & FAQ"
              Icon={HelpCircle}
              iconBg="#F3F4F6"
              iconColor="#6B7280"
              onPress={() => setInfo({ title: 'Help & FAQ', message: 'Our help centre is on its way. For now, reach out to us directly if you need support.' })}
            />
            <MenuRow
              label="Privacy"
              Icon={Shield}
              iconBg="#F3F4F6"
              iconColor="#6B7280"
              onPress={() => setInfo({ title: 'Privacy', message: 'Privacy settings will be available in a future update.' })}
              isLast
            />
          </View>

          {/* Sign Out */}
          <TouchableOpacity
            onPress={() => setSignOutVisible(true)}
            activeOpacity={0.7}
            className="bg-white rounded-2xl px-4 py-4 border border-[#E5E0D5] mb-8 flex-row items-center justify-center gap-2"
          >
            <LogOut size={18} color="#EF4444" />
            <Text className="text-danger font-semibold text-base">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sign Out confirm */}
      <ConfirmModal
        visible={signOutVisible}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign Out"
        destructive
        onConfirm={() => { setSignOutVisible(false); signOut(); }}
        onCancel={() => setSignOutVisible(false)}
      />

      {/* Info modal for menu rows */}
      <Modal visible={info !== null} transparent animationType="fade" onRequestClose={() => setInfo(null)}>
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="bg-white rounded-3xl p-6 w-full items-center border border-[#E5E0D5]">
            <Text className="text-navy text-xl font-bold mb-2 text-center">{info?.title}</Text>
            <Text className="text-gray-500 text-sm mb-6 text-center">{info?.message}</Text>
            <Button title="Got it" onPress={() => setInfo(null)} className="w-full" />
          </View>
        </View>
      </Modal>
    </View>
  );
}
