import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../src/components/ui/Button';

// NOTE: RevenueCat (react-native-purchases) requires an EAS Dev Build.
// This is a placeholder UI that will be wired to RevenueCat in Phase 5.
// To integrate: replace this with RevenueCatUI.presentPaywallIfNeeded
// or render a custom paywall using Purchases.getOfferings().

const features = [
  { emoji: '📦', text: 'Extended character pool (50+ per category)' },
  { emoji: '🛠️', text: 'Build & save custom packs' },
  { emoji: '🔗', text: 'Share packs with a 6-char code' },
  { emoji: '🔀', text: 'Mix multiple categories in one pack' },
  { emoji: '🆕', text: 'Future categories automatically included' },
];

export default function Paywall() {
  const router = useRouter();

  const handleSubscribe = (plan: 'monthly' | 'annual') => {
    // TODO Phase 5: integrate Purchases.purchasePackage(package)
    Alert.alert(
      'Coming Soon',
      `${plan === 'annual' ? 'Annual' : 'Monthly'} subscription will be available once connected to RevenueCat.`,
    );
  };

  const handleRestore = () => {
    // TODO Phase 5: Purchases.restorePurchases()
    Alert.alert('Restore', 'This will restore purchases once RevenueCat is connected.');
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#1c1d4b', '#0F172A']}
          className="pt-10 pb-6 px-6 items-center"
        >
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-4 right-4 p-2"
          >
            <Text className="text-slate-400 text-lg">✕</Text>
          </TouchableOpacity>

          <Text className="text-4xl mb-3">⭐</Text>
          <Text className="text-white text-3xl font-bold text-center">Guess Who Pro</Text>
          <Text className="text-slate-400 text-sm text-center mt-2 max-w-xs">
            Unlock the full experience with custom packs and the extended character pool
          </Text>
        </LinearGradient>

        {/* Features */}
        <View className="px-6 py-6 gap-4">
          {features.map((f, i) => (
            <View key={i} className="flex-row items-center gap-3">
              <View className="w-9 h-9 bg-primary-900 rounded-xl items-center justify-center">
                <Text className="text-lg">{f.emoji}</Text>
              </View>
              <Text className="text-slate-200 text-sm flex-1">{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Pricing */}
        <View className="px-6 gap-3 pb-8">
          {/* Annual (recommended) */}
          <TouchableOpacity
            onPress={() => handleSubscribe('annual')}
            className="border-2 border-primary-500 bg-primary-950 rounded-2xl p-4"
          >
            <View className="flex-row items-center justify-between">
              <View>
                <View className="flex-row items-center gap-2 mb-0.5">
                  <Text className="text-white font-bold text-base">Annual Plan</Text>
                  <View className="bg-accent/20 px-2 py-0.5 rounded-full border border-accent/40">
                    <Text className="text-accent text-xs font-semibold">SAVE 40%</Text>
                  </View>
                </View>
                <Text className="text-slate-400 text-xs">$29.99 / year</Text>
              </View>
              <View className="w-5 h-5 rounded-full border-2 border-primary-500 bg-primary-500 items-center justify-center">
                <View className="w-2 h-2 rounded-full bg-white" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Monthly */}
          <TouchableOpacity
            onPress={() => handleSubscribe('monthly')}
            className="border border-slate-600 bg-surface-card rounded-2xl p-4"
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white font-semibold text-base">Monthly Plan</Text>
                <Text className="text-slate-400 text-xs">$4.99 / month</Text>
              </View>
              <View className="w-5 h-5 rounded-full border-2 border-slate-600" />
            </View>
          </TouchableOpacity>

          <Button
            title="Get Pro Access"
            size="lg"
            onPress={() => handleSubscribe('annual')}
            className="mt-2"
          />

          <TouchableOpacity onPress={handleRestore} className="items-center py-2">
            <Text className="text-slate-500 text-xs">Restore Purchases</Text>
          </TouchableOpacity>

          <Text className="text-slate-600 text-xs text-center px-4 mt-1">
            Subscriptions auto-renew. Cancel anytime in Settings. By subscribing you agree to our Terms of Service.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
