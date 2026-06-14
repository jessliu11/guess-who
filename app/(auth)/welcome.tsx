import React, { useState } from 'react';
import { View, Text, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight } from 'lucide-react-native';
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
  };

  return (
    <LinearGradient
      colors={['#7C3AED', '#C026D3']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 24, paddingBottom: 32, paddingTop: 16 }}>
        {/* Logo / animation placeholder */}
        <View style={{ flex: 1 }} />

        {/* Actions */}
        <View style={{ gap: 12 }}>
          <TouchableOpacity
            className="bg-white py-4 rounded-full items-center active:opacity-80"
            onPress={() => router.push('/(auth)/sign-up')}
            activeOpacity={0.85}
          >
            <Text className="text-primary-600 font-semibold text-base">Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="py-4 rounded-full items-center"
            style={{ borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.1)' }}
            onPress={() => router.push('/(auth)/sign-in')}
            activeOpacity={0.85}
          >
            <Text className="text-white font-semibold text-base">Sign in</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="py-3 items-center flex-row justify-center"
            onPress={handleGuest}
            disabled={guestLoading}
            activeOpacity={0.7}
          >
            <Text className="text-white font-medium text-sm mr-1">
              {guestLoading ? 'Signing in…' : 'Play as Guest'}
            </Text>
            {!guestLoading && <ArrowRight size={14} color="white" />}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
