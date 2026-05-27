import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../src/components/ui/Button';

// NOTE: RevenueCat (react-native-purchases) requires an EAS Dev Build.
// This is a placeholder UI that will be wired to RevenueCat in Phase 5.

const features = [
  { icon: 'cube-outline' as const, text: 'Extended character pool (50+ per category)' },
  { icon: 'construct-outline' as const, text: 'Build & save custom packs' },
  { icon: 'link-outline' as const, text: 'Share packs with a 6-char code' },
  { icon: 'shuffle-outline' as const, text: 'Mix multiple categories in one pack' },
  { icon: 'add-circle-outline' as const, text: 'Future categories automatically included' },
];

export default function Paywall() {
  const router = useRouter();

  const handleSubscribe = (plan: 'monthly' | 'annual') => {
    Alert.alert(
      'Coming Soon',
      `${plan === 'annual' ? 'Annual' : 'Monthly'} subscription will be available once connected to RevenueCat.`,
    );
  };

  const handleRestore = () => {
    Alert.alert('Restore', 'This will restore purchases once RevenueCat is connected.');
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#7C3AED', '#C026D3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="pt-10 pb-8 px-6 items-center"
        >
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-4 right-4 w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
          >
            <Ionicons name="close" size={18} color="white" />
          </TouchableOpacity>

          <View className="w-16 h-16 rounded-2xl bg-accent items-center justify-center mb-4">
            <Text className="text-3xl">⭐</Text>
          </View>
          <Text className="text-white text-3xl font-bold text-center">Who, What, Where? Pro</Text>
          <Text className="text-white/75 text-sm text-center mt-2 max-w-xs">
            Unlock the full experience with custom packs and the extended character pool
          </Text>
        </LinearGradient>

        {/* Features */}
        <View className="px-6 py-6 gap-4">
          {features.map((f, i) => (
            <View key={i} className="flex-row items-center gap-3">
              <View className="w-9 h-9 bg-primary-100 rounded-xl items-center justify-center">
                <Ionicons name={f.icon} size={18} color="#7C3AED" />
              </View>
              <Text className="text-navy text-sm flex-1">{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Pricing */}
        <View className="px-6 gap-3 pb-8">
          {/* Annual (recommended) */}
          <TouchableOpacity
            onPress={() => handleSubscribe('annual')}
            className="border-2 border-primary-600 bg-primary-50 rounded-2xl p-4"
          >
            <View className="flex-row items-center justify-between">
              <View>
                <View className="flex-row items-center gap-2 mb-0.5">
                  <Text className="text-navy font-bold text-base">Annual Plan</Text>
                  <View className="bg-accent/20 px-2 py-0.5 rounded-full border border-accent/40">
                    <Text className="text-amber-700 text-xs font-semibold">SAVE 40%</Text>
                  </View>
                </View>
                <Text className="text-gray-500 text-xs">$29.99 / year</Text>
              </View>
              <View className="w-5 h-5 rounded-full border-2 border-primary-600 bg-primary-600 items-center justify-center">
                <View className="w-2 h-2 rounded-full bg-white" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Monthly */}
          <TouchableOpacity
            onPress={() => handleSubscribe('monthly')}
            className="border border-gray-200 bg-white rounded-2xl p-4"
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-navy font-semibold text-base">Monthly Plan</Text>
                <Text className="text-gray-500 text-xs">$4.99 / month</Text>
              </View>
              <View className="w-5 h-5 rounded-full border-2 border-gray-300" />
            </View>
          </TouchableOpacity>

          <Button
            title="Get Pro Access"
            size="lg"
            onPress={() => handleSubscribe('annual')}
            className="mt-2"
          />

          <TouchableOpacity onPress={handleRestore} className="items-center py-2">
            <Text className="text-gray-400 text-xs">Restore Purchases</Text>
          </TouchableOpacity>

          <Text className="text-gray-400 text-xs text-center px-4 mt-1">
            Subscriptions auto-renew. Cancel anytime in Settings. By subscribing you agree to our Terms of Service.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
