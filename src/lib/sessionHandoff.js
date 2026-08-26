import { supabase } from '@/api/supabaseClient';
import { setSession } from '@/api/supabaseAuth';

// The app signs in with Telegram launch data, which only exists inside the
// Telegram client. Opening a page in an external wallet browser (MetaMask)
// therefore lands on "Golden Bounty opens inside Telegram".
// These helpers carry the CURRENT Supabase session over to that browser in the
// link, so the deposit page opens already logged in.

const PARAM = 'gbs';

function b64urlEncode(str) {
  return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(str) {
  const s = str.replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(escape(atob(s)));
}

// Builds an absolute URL (on the canonical brand domain) that carries the
// player's session, so an external wallet browser opens it authenticated.
export async function buildHandoffUrl(pathWithQuery) {
  const { data: { session } } = await supabase.auth.getSession();
  const base = 'https://golden-bounty.com' + pathWithQuery;
  if (!session?.access_token || !session?.refresh_token) return base;
  const token = b64urlEncode(JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  }));
  return base + (base.includes('?') ? '&' : '?') + PARAM + '=' + encodeURIComponent(token);
}

// Adopts a handed-over session from the URL (if present) and strips it from the
// address bar. Returns true when a session was adopted.
export async function adoptHandoffSession() {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get(PARAM);
    if (!raw) return false;
    const { access_token, refresh_token } = JSON.parse(b64urlDecode(raw));
    await setSession({ access_token, refresh_token });
    params.delete(PARAM);
    const q = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (q ? '?' + q : ''));
    return true;
  } catch {
    return false;
  }
}