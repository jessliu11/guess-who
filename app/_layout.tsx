import '../src/globals.css';
import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
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
    configureRevenueCat();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Auth state is known from the cached AsyncStorage session — unblock
        // navigation and dismiss the splash immediately. Profile and entitlement
        // load in the background so a slow/unavailable network on cold launch
        // never leaves the user stuck on a blank screen.
        setLoading(false);
        SplashScreen.hideAsync();

        if (session?.user) {
          identifyUser(session.user.id).catch(() => {});

          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select()
              .eq('id', session.user.id)
              .single();
            setProfile(profile ?? null);
          } catch {
            // Profile loads as null; premium gate defaults to free until next
            // successful fetch.
          }

          refreshEntitlement().catch(() => {
            useSubscriptionStore.getState().setLoading(false);
          });
        } else {
          setProfile(null);
          useSubscriptionStore.getState().setIsPremium(false);
          useSubscriptionStore.getState().setLoading(false);
        }
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
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) return null;

  // Apply synchronously before any child mounts so every Text gets Poppins from the first render.
  if (!(Text as any).defaultProps) (Text as any).defaultProps = {};
  (Text as any).defaultProps.style = { fontFamily: 'Poppins_400Regular' };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthGate>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FAF8F2' } }}>
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
