import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '../types/game.types';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => void;
  isPremium: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),

  signOut: () => set({ user: null, session: null, profile: null }),

  isPremium: () => get().profile?.is_premium ?? false,
}));
