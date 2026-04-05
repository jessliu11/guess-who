/**
 * RevenueCat Integration
 *
 * Prerequisites (Phase 5):
 *   1. Run: eas build --profile development
 *      (react-native-purchases is a native module — Expo Go won't work)
 *
 *   2. Install:
 *      npm install react-native-purchases react-native-purchases-ui
 *
 *   3. Add to app.config.ts plugins:
 *      ['react-native-purchases', { ...} ]
 *
 *   4. Configure products in:
 *      - App Store Connect: com.guesswho.app.pro.monthly, com.guesswho.app.pro.annual
 *      - Google Play Console: same product IDs
 *      - RevenueCat dashboard: entitlement "premium", offering "default"
 *
 *   5. Uncomment the implementation below and remove the stub
 */

import { Platform } from 'react-native';
import { REVENUECAT_APPLE_KEY, REVENUECAT_GOOGLE_KEY } from '../constants/config';
import { useSubscriptionStore } from '../store/subscriptionStore';

// ---- STUB (replace with real implementation in Phase 5) ----

export async function configureRevenueCat(_userId?: string): Promise<void> {
  console.log('[RevenueCat] Stub — configure with EAS dev build');
}

export async function identifyUser(_userId: string): Promise<void> {
  console.log('[RevenueCat] Stub — identify user');
}

export async function checkPremiumEntitlement(): Promise<boolean> {
  return false;
}

export async function refreshEntitlement(): Promise<void> {
  const isPremium = await checkPremiumEntitlement();
  useSubscriptionStore.getState().setIsPremium(isPremium);
  useSubscriptionStore.getState().setLoading(false);
}

export async function restorePurchases(): Promise<boolean> {
  console.log('[RevenueCat] Stub — restore purchases');
  return false;
}

// ---- REAL IMPLEMENTATION (uncomment in Phase 5) ----
/*
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { PREMIUM_ENTITLEMENT_ID } from '../constants/config';

export async function configureRevenueCat(userId?: string): Promise<void> {
  const apiKey = Platform.select({
    ios: REVENUECAT_APPLE_KEY,
    android: REVENUECAT_GOOGLE_KEY,
    default: REVENUECAT_APPLE_KEY,
  })!;

  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey, appUserID: userId ?? null });
}

export async function identifyUser(userId: string): Promise<void> {
  await Purchases.logIn(userId);
}

export async function checkPremiumEntitlement(): Promise<boolean> {
  const customerInfo = await Purchases.getCustomerInfo();
  return customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== undefined;
}

export async function refreshEntitlement(): Promise<void> {
  const isPremium = await checkPremiumEntitlement();
  useSubscriptionStore.getState().setIsPremium(isPremium);
  useSubscriptionStore.getState().setLoading(false);
}

export async function restorePurchases(): Promise<boolean> {
  const customerInfo = await Purchases.restorePurchases();
  return customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== undefined;
}
*/
