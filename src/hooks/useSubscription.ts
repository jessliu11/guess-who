import { useSubscriptionStore } from '../store/subscriptionStore';
import { useAuthStore } from '../store/authStore';
import { DEV_UNLOCK_ALL_PACKS } from '../constants/config';

export function useSubscription() {
  const { isPremium, isLoading } = useSubscriptionStore();
  const profile = useAuthStore((s) => s.profile);

  // isPremium is sourced from both RevenueCat (real-time) and profile.is_premium (server)
  const hasPremium = DEV_UNLOCK_ALL_PACKS || isPremium || (profile?.is_premium ?? false);

  return { isPremium: hasPremium, isLoading };
}
