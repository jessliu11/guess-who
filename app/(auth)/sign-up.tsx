import React, { useState } from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui/Button';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { supabase } from '../../src/lib/supabase';

export default function SignUp() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!displayName.trim() || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: displayName } },
    });
    setLoading(false);
    if (error) {
      Alert.alert('Sign Up Failed', error.message);
    }
    // AuthGate handles redirect on success
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScreenHeader title="Create Account" />
      <View className="flex-1 px-6 pt-8 gap-4">
        <View>
          <Text className="text-slate-400 text-sm mb-1.5">Display Name</Text>
          <TextInput
            className="bg-surface-card border border-slate-600 rounded-xl px-4 py-3.5 text-white text-base"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            placeholderTextColor="#64748B"
            placeholder="Your name"
          />
        </View>

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
            autoComplete="new-password"
            placeholderTextColor="#64748B"
            placeholder="Min. 8 characters"
          />
        </View>

        <Button
          title="Create Account"
          size="lg"
          loading={loading}
          onPress={handleSignUp}
          className="mt-2"
        />

        <View className="flex-row justify-center gap-1 mt-4">
          <Text className="text-slate-400 text-sm">Already have an account?</Text>
          <Text
            className="text-primary-400 text-sm font-medium"
            onPress={() => router.replace('/(auth)/sign-in')}
          >
            Sign In
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
