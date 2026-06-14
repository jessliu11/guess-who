import React, { useState } from 'react';
import { View, Text, Alert, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Mail, Lock } from 'lucide-react-native';
import { Button } from '../../src/components/ui/Button';
import { PillInput } from '../../src/components/ui/PillInput';
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
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 pt-4 pb-8">
            {/* Back */}
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} className="mb-8">
              <ChevronLeft size={24} color="#1E1B4B" />
            </TouchableOpacity>

            {/* Title */}
            <Text className="text-navy text-3xl font-bold mb-1">Welcome Back!</Text>
            <Text className="text-gray-500 text-sm mb-8">Sign in to pick up where you left off.</Text>

            {/* Form */}
            <PillInput
              icon={<Mail size={18} color="#1E1B4B" />}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
            />
            <PillInput
              icon={<Lock size={18} color="#1E1B4B" />}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureToggle
              autoComplete="password"
            />

            {/* Spacer pushes button to bottom */}
            <View className="flex-1" />

            <Button
              title="Sign In"
              size="lg"
              loading={loading}
              onPress={handleSignIn}
              className="mb-4"
            />

            <View className="flex-row justify-center gap-1">
              <Text className="text-gray-500 text-sm">Don&apos;t have an account?</Text>
              <Text
                className="text-primary-600 text-sm font-semibold"
                onPress={() => router.replace('/(auth)/sign-up')}
              >
                Sign Up
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
