import React, { useState } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/ui/Button';
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
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-6 pt-4 pb-8">
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-white border border-gray-200 items-center justify-center mb-8"
            activeOpacity={0.7}
          >
            <Text className="text-navy text-base leading-none">‹</Text>
          </TouchableOpacity>

          {/* Title */}
          <Text className="text-navy text-3xl font-bold mb-1">Welcome back</Text>
          <Text className="text-gray-500 text-sm mb-8">Sign in to pick up where you left off.</Text>

          {/* Form */}
          <View className="gap-4">
            <View>
              <Text className="text-navy text-sm font-medium mb-1.5">Email</Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-3.5 gap-3">
                <Ionicons name="mail-outline" size={18} color="#6B7280" />
                <TextInput
                  className="flex-1 text-navy text-base"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholderTextColor="#9CA3AF"
                  placeholder="you@email.com"
                />
              </View>
            </View>

            <View>
              <Text className="text-navy text-sm font-medium mb-1.5">Password</Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-3.5 gap-3">
                <Ionicons name="lock-closed-outline" size={18} color="#6B7280" />
                <TextInput
                  className="flex-1 text-navy text-base"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password"
                  placeholderTextColor="#9CA3AF"
                  placeholder="••••••••"
                />
              </View>
            </View>

            <Button
              title="→  Sign In"
              size="lg"
              loading={loading}
              onPress={handleSignIn}
              className="mt-2"
            />

            <View className="flex-row justify-center gap-1 mt-2">
              <Text className="text-gray-500 text-sm">Don't have an account?</Text>
              <Text
                className="text-primary-600 text-sm font-semibold"
                onPress={() => router.replace('/(auth)/sign-up')}
              >
                Sign Up
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
