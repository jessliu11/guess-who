import React, { useState } from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui/Button';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { supabase } from '../../src/lib/supabase';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Sign In Failed', error.message);
    }
    // On success, AuthGate redirects automatically
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScreenHeader title="Sign In" />
      <View className="flex-1 px-6 pt-8 gap-4">
        <View>
          <Text className="text-slate-400 text-sm mb-1.5">Email</Text>
          <TextInput
            className="bg-surface-card border border-slate-600 rounded-xl px-4 py-3.5 text-white text-base"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholderTextColor="#64748B"
            placeholder="you@example.com"
          />
        </View>

        <View>
          <Text className="text-slate-400 text-sm mb-1.5">Password</Text>
          <TextInput
            className="bg-surface-card border border-slate-600 rounded-xl px-4 py-3.5 text-white text-base"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            placeholderTextColor="#64748B"
            placeholder="••••••••"
          />
        </View>

        <Button
          title="Sign In"
          size="lg"
          loading={loading}
          onPress={handleSignIn}
          className="mt-2"
        />

        <View className="flex-row justify-center gap-1 mt-4">
          <Text className="text-slate-400 text-sm">Don't have an account?</Text>
          <Text
            className="text-primary-400 text-sm font-medium"
            onPress={() => router.replace('/(auth)/sign-up')}
          >
            Sign Up
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
