import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui/Button';
import { supabase } from '../../src/lib/supabase';

export default function Welcome() {
  const router = useRouter();
  const [guestLoading, setGuestLoading] = useState(false);

  const handleGuest = async () => {
    setGuestLoading(true);
    const { error } = await supabase.auth.signInAnonymously();
    setGuestLoading(false);
    if (error) {
      Alert.alert('Guest Sign-In Failed', error.message);
    }
    // AuthGate will redirect to tabs on success
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <LinearGradient
        colors={['#1c1d4b', '#0F172A']}
        className="flex-1 px-6 justify-between pb-10 pt-16"
      >
        {/* Hero */}
        <View className="items-center flex-1 justify-center gap-4">
          <View className="w-24 h-24 bg-primary-600 rounded-3xl items-center justify-center mb-2">
            <Text className="text-5xl">🃏</Text>
          </View>
          <Text className="text-white text-4xl font-bold text-center">Guess Who</Text>
          <Text className="text-slate-400 text-base text-center max-w-xs leading-relaxed">
            The classic guessing game, reimagined with your favourite celebrities, athletes, and more.
          </Text>
        </View>

        {/* Actions */}
        <View className="gap-3">
          <Button
            title="Create Account"
            size="lg"
            onPress={() => router.push('/(auth)/sign-up')}
          />
          <Button
            title="Sign In"
            variant="secondary"
            size="lg"
            onPress={() => router.push('/(auth)/sign-in')}
          />
          <Button
            title="Play as Guest"
            variant="ghost"
            size="lg"
            loading={guestLoading}
            onPress={handleGuest}
          />
          <Text className="text-slate-600 text-xs text-center mt-2">
            Guest accounts can't save stats or create packs
          </Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}
