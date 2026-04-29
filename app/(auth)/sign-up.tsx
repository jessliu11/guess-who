import React, { useState } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/ui/Button';
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: displayName } },
    });
    setLoading(false);
    if (error) {
      Alert.alert('Sign Up Failed', error.message);
    } else if (!data.session) {
      Alert.alert(
        'Check Your Email',
        'A confirmation link has been sent to your email address. Please confirm your account to continue.'
      );
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
          <Text className="text-navy text-3xl font-bold mb-1">Create your account</Text>
          <Text className="text-gray-500 text-sm mb-8">Save your stats, build packs, and play with friends.</Text>

          {/* Form */}
          <View className="gap-4">
            <View>
              <Text className="text-navy text-sm font-medium mb-1.5">Display Name</Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-3.5 gap-3">
                <Ionicons name="person-outline" size={18} color="#6B7280" />
                <TextInput
                  className="flex-1 text-navy text-base"
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                  placeholderTextColor="#9CA3AF"
                  placeholder="What should friends call you?"
                />
              </View>
            </View>

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
                  autoComplete="new-password"
                  placeholderTextColor="#9CA3AF"
                  placeholder="Min 8 characters"
                />
              </View>
            </View>

            <Button
              title="→  Create Account"
              size="lg"
              loading={loading}
              onPress={handleSignUp}
              className="mt-2"
            />

            <View className="flex-row justify-center gap-1 mt-2">
              <Text className="text-gray-500 text-sm">Already have an account?</Text>
              <Text
                className="text-primary-600 text-sm font-semibold"
                onPress={() => router.replace('/(auth)/sign-in')}
              >
                Sign In
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
