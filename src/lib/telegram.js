// Telegram Mini App helpers. The app runs inside Telegram, so the WebApp
// bridge provides the signed initData used as the only login identity.

const CACHE_KEY = 'gb_tg_init_data';

export function tgWebApp() {
  return typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
}

// Telegram Web (web.telegram.org / a-version) launches the mini app inside an
// iframe and passes the signed payload in the URL hash as `tgWebAppData`.
// The official script normally parses it, but on some web clients the hash is
// gone by the time it runs (redirects, router rewrites), so read it ourselves
// and cache it for the rest of the session.
function fromUrl() {
  if (typeof window === 'undefined') return '';
  const grab = (str) => {
    if (!str) return '';
    const params = new URLSearchParams(str.replace(/^[#?]/, ''));
    return params.get('tgWebAppData') || '';
  };
  return grab(window.location.hash) || grab(window.location.search);
}

function cached() {
  try { return sessionStorage.getItem(CACHE_KEY) || ''; } catch { return ''; }
}

function cache(value) {
  if (!value) return;
  try { sessionStorage.setItem(CACHE_KEY, value); } catch { /* private mode */ }
}

export function tgInitData() {
  const data = tgWebApp()?.initData || fromUrl() || cached();
  cache(data);
  return data;
}

export function isInsideTelegram() {
  return tgInitData().length > 0;
}

export function tgUser() {
  return tgWebApp()?.initDataUnsafe?.user || null;
}

// Numeric Telegram user id of whoever launched the mini app right now.
// Read from the WebApp bridge, falling back to parsing the signed initData —
// needed to detect account switching when several Telegram accounts share the
// same client (the stored session would otherwise keep the previous identity).
export function tgUserId() {
  const u = tgUser();
  if (u?.id) return String(u.id);
  try {
    const raw = new URLSearchParams(tgInitData()).get('user');
    if (raw) return String(JSON.parse(raw).id || '');
  } catch { /* malformed payload */ }
  return '';
}

// Expands the mini app to full height and applies the dark casino chrome.
export function tgReady() {
  const wa = tgWebApp();
  if (!wa) return;
  try {
    wa.ready();
    wa.expand();
    wa.setHeaderColor?.('#0b0805');
    wa.setBackgroundColor?.('#0b0805');
  } catch { /* older Telegram clients */ }
}