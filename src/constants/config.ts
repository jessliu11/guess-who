export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const REVENUECAT_APPLE_KEY = process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY ?? '';
export const REVENUECAT_GOOGLE_KEY = process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY ?? '';

// Set to true to bypass all premium gates during local testing (remove before shipping)
export const DEV_UNLOCK_ALL_PACKS = true;

export const PREMIUM_ENTITLEMENT_ID = 'premium';
export const JOIN_CODE_LENGTH = 6;
export const PACK_CODE_LENGTH = 6;
// Applies to 'waiting' sessions only — active games are extended to 24 h by a DB trigger.
export const SESSION_EXPIRY_HOURS = 2;
export const LOADING_TIMEOUT_MS = 15_000;
export const STANDARD_PACK_SIZE = 24;
export const EXTENDED_PACK_MIN = 20;
export const EXTENDED_PACK_MAX = 24;

export const FREE_CATEGORY_IDS = ['celebrities', 'fictional', 'cartoons'];
export const FREE_CUSTOM_CHARACTER_LIMIT = 12;
