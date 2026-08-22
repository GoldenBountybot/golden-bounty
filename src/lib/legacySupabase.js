import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/api/supabaseClient';

// A second, isolated Supabase client used ONLY to sign in to a legacy
// (email / Google) account during Telegram binding. It never persists a
// session, so it can't disturb the active Telegram session.
export const legacySupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    // Implicit flow: the Google redirect comes back with tokens in the URL
    // hash, so no PKCE verifier needs to survive in storage.
    flowType: 'implicit',
    storageKey: 'gb_legacy_auth',
  },
});