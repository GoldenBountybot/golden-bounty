// Telegram Mini App helpers. The app runs inside Telegram, so the WebApp
// bridge provides the signed initData used as the only login identity.

export function tgWebApp() {
  return typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
}

export function isInsideTelegram() {
  const wa = tgWebApp();
  return !!(wa && wa.initData && wa.initData.length > 0);
}

export function tgInitData() {
  return tgWebApp()?.initData || '';
}

export function tgUser() {
  return tgWebApp()?.initDataUnsafe?.user || null;
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