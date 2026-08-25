import { tgWebApp, isInsideTelegram } from '@/lib/telegram';

// Opens a wallet universal link (MetaMask / Trust Wallet).
//
// Inside the Telegram Mini App webview a plain window.open() keeps the link in
// Telegram's own webview, which cannot handle the wallet's custom scheme and
// shows "ERR_UNKNOWN_URL_SCHEME" — the request never reaches the wallet.
// Telegram's openLink() hands the URL to the OS instead, so the wallet app
// opens reliably every time.
export function openWalletLink(url) {
  if (isInsideTelegram()) {
    const wa = tgWebApp();
    if (wa?.openLink) {
      try {
        wa.openLink(url, { try_instant_view: false });
        return;
      } catch { /* fall through to window.open */ }
    }
  }
  try { window.open(url, '_blank'); } catch { /* popup blocked */ }
}