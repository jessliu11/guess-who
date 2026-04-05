import { create } from 'zustand';

interface SubscriptionState {
  isPremium: boolean;
  isLoading: boolean;
  setIsPremium: (val: boolean) => void;
  setLoading: (val: boolean) => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  isPremium: false,
  isLoading: true,
  setIsPremium: (isPremium) => set({ isPremium }),
  setLoading: (isLoading) => set({ isLoading }),
}));
