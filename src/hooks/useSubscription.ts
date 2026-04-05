import { useSubscriptionStore } from '../store/subscriptionStore';
import { useAuthStore } from '../store/authStore';

export function useSubscription() {
  const { isPremium, isLoading } = useSubscriptionStore();
  const profile = useAuthStore((s) => s.profile);

  // isPremium is sourced from both RevenueCat (real-time) and profile.is_premium (server)
  const hasPremium = isPremium || (profile?.is_premium ?? false);

  return { isPremium: hasPremium, isLoading };
}
