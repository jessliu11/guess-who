import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY, LOADING_TIMEOUT_MS } from '../constants/config';

// On cold launch iOS's network stack can take several seconds to initialise.
// Without a timeout, Supabase REST calls (including the internal JWT refresh)
// hang forever and leave loading spinners stuck. Aborting after LOADING_TIMEOUT_MS
// turns a silent hang into a catchable error so callers can surface a retry.
function fetchWithTimeout(url: RequestInfo | URL, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  // Chain any signal the caller already set so both can abort independently.
  const callerSignal = options.signal;
  if (callerSignal) {
    callerSignal.addEventListener('abort', () => controller.abort(callerSignal.reason));
  }
  const timer = setTimeout(() => controller.abort(new DOMException('Network timeout', 'AbortError')), LOADING_TIMEOUT_MS);
  return fetch(url as string, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: { fetch: fetchWithTimeout },
});
