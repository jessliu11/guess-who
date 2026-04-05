import '../src/globals.css';
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from '../src/lib/supabase';
import { useAuthStore } from '../src/store/authStore';
import { useSubscriptionStore } from '../src/store/subscriptionStore';
import { configureRevenueCat, identifyUser, refreshEntitlement } from '../src/lib/revenuecat';

SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { user, isLoading, setUser, setSession, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    // Initialize RevenueCat (anonymous until user signs in)
    configureRevenueCat();

    // Listen to Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Identify user in RevenueCat
          identifyUser(session.user.id).catch(() => {});

          // Fetch profile
          const { data: profile } = await supabase
            .from('profiles')
            .select()
            .eq('id', session.user.id)
            .single();
          setProfile(profile ?? null);

          // Check premium entitlement
          refreshEntitlement().catch(() => {
            useSubscriptionStore.getState().setLoading(false);
          });
        } else {
          setProfile(null);
          useSubscriptionStore.getState().setIsPremium(false);
          useSubscriptionStore.getState().setLoading(false);
        }

        setLoading(false);
        SplashScreen.hideAsync();
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)/home');
    }
  }, [user, isLoading, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthGate>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0F172A' } }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(game)" />
            <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
          </Stack>
        </AuthGate>
        <StatusBar style="light" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
