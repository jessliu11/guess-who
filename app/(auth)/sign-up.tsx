import React, { useState } from 'react';
import { View, Text, Alert, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, User, Mail, Lock } from 'lucide-react-native';
import { Button } from '../../src/components/ui/Button';
import { PillInput } from '../../src/components/ui/PillInput';
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
            <Text className="text-navy text-3xl font-bold mb-1">Create your account</Text>
            <Text className="text-gray-500 text-sm mb-8">Save your stats, build packs, and play with friends.</Text>

            {/* Form */}
            <PillInput
              icon={<User size={18} color="#1E1B4B" />}
              placeholder="Display Name"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              autoComplete="name"
            />
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
              autoComplete="new-password"
            />

            <View className="flex-1" />

            <Button
              title="Create Account"
              size="lg"
              loading={loading}
              onPress={handleSignUp}
              className="mb-4"
            />

            <View className="flex-row justify-center gap-1">
              <Text className="text-gray-500 text-sm">Already have an account?</Text>
              <Text
                className="text-primary-600 text-sm font-semibold"
                onPress={() => router.replace('/(auth)/sign-in')}
              >
                Sign In
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
