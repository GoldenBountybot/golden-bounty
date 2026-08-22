import { createClient } from '@supabase/supabase-js';

// Public Supabase project credentials. The anon key is safe in the browser —
// all access is enforced by Row Level Security on the database side.
export const SUPABASE_URL = 'https://ovyrljtgviabkamomjso.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92eXJsanRndmlhYmthbW9tanNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczODA4ODAsImV4cCI6MjEwMjk1Njg4MH0.wlMWfMz_2UeX7xWA70ESi9WX91LA0-unjlG5TAQDYJk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: 'gb_supabase_auth',
  },
});