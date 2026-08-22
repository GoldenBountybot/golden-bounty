import { supabase } from '@/api/supabaseClient';
import { rowOut, rowIn } from '@/api/supabaseMaps';

// Returns the logged-in player: the auth user merged with their profile row.
// Throws when there is no session, matching the previous SDK behaviour.
export async function me() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    const err = new Error('Not authenticated');
    err.status = 401;
    throw err;
  }
  const { data: profile, error } = await supabase
    .from('profiles').select('*').eq('id', session.user.id).maybeSingle();
  if (error) throw new Error(error.message);
  return {
    ...rowOut(profile || {}),
    id: session.user.id,
    email: profile?.email || session.user.email || '',
  };
}

export async function updateMe(data) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');
  const { data: row, error } = await supabase
    .from('profiles').update(rowIn(data)).eq('id', session.user.id).select().single();
  if (error) throw new Error(error.message);
  return rowOut(row);
}

export async function isAuthenticated() {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session?.user;
}

export async function logout(redirectUrl) {
  await supabase.auth.signOut();
  window.location.href = redirectUrl || '/login';
}

export function redirectToLogin(nextUrl) {
  const next = nextUrl || window.location.href;
  window.location.href = `/login?returnTo=${encodeURIComponent(next)}`;
}

export async function setSession(session) {
  const { error } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  if (error) throw new Error(error.message);
}