import React, { useState, useEffect } from 'react';
import { View, Text, Alert, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';

const FALLBACK_COLORS = ['#7C3AED', '#F59E0B', '#10B981', '#C026D3'];

export default function Welcome() {
  const router = useRouter();
  const [guestLoading, setGuestLoading] = useState(false);
  const [avatarUrls, setAvatarUrls] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('characters')
          .select('image_url')
          .eq('is_active', true)
          .is('creator_id', null)
          .not('image_url', 'is', null)
          .limit(4);
        if (data && data.length > 0) {
          setAvatarUrls(data.map((c: { image_url: string }) => c.image_url));
        }
      } catch {
        // fallback to colored circles
      }
    })();
  }, []);

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
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 24, paddingBottom: 24, paddingTop: 16, justifyContent: 'space-between' }}>
        {/* Hero */}
        <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center', gap: 20 }}>
          {/* App icon */}
          <View className="w-20 h-20 rounded-2xl items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}>
            <Text className="text-white text-4xl font-bold">?</Text>
          </View>

          <Text className="text-white text-5xl font-bold text-center" style={{ fontFamily: 'Inter_700Bold' }}>Who, What, Where?</Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, textAlign: 'center', maxWidth: 280, lineHeight: 24 }}>
            The classic guessing game, reimagined. Play with friends using any characters you can dream up.
          </Text>

          {/* Character avatars */}
          <View className="flex-row items-center mt-2">
            {(avatarUrls.length > 0 ? avatarUrls : FALLBACK_COLORS).map((item, i) => (
              <View
                key={i}
                className="w-14 h-14 rounded-full border-2 border-white overflow-hidden items-center justify-center"
                style={{ marginLeft: i === 0 ? 0 : -12, backgroundColor: avatarUrls.length === 0 ? item : undefined }}
              >
                {avatarUrls.length > 0 ? (
                  <Image source={{ uri: item }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <Text className="text-white text-xl font-bold">👤</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={{ gap: 12 }}>
          <TouchableOpacity
            className="bg-white py-4 rounded-2xl items-center active:opacity-80"
            onPress={() => router.push('/(auth)/sign-up')}
            activeOpacity={0.85}
          >
            <Text className="text-primary-600 font-semibold text-base">
              👤+ Create Account
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="py-4 rounded-2xl items-center active:opacity-80"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' }}
            onPress={() => router.push('/(auth)/sign-in')}
            activeOpacity={0.85}
          >
            <Text className="text-white font-semibold text-base">→ Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="py-3 items-center active:opacity-70"
            onPress={handleGuest}
            disabled={guestLoading}
            activeOpacity={0.7}
          >
            <Text className="text-white font-medium text-base">
              {guestLoading ? 'Signing in…' : 'Play as Guest →'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
