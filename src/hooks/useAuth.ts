import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const { user, session, profile, isLoading, isPremium } = useAuthStore();

  const signOut = async () => {
    await supabase.auth.signOut();
    useAuthStore.getState().signOut();
  };

  return {
    user,
    session,
    profile,
    isLoading,
    isPremium: isPremium(),
    isSignedIn: !!user,
    isAnonymous: user?.is_anonymous ?? false,
    signOut,
  };
}
