import { isInsideTelegram } from '@/lib/telegram';
import { openWalletLink } from '@/lib/openWalletLink';

// Brings the connected wallet app to the foreground so a pending signing
// request is actually shown to the user.
//
// WalletConnect sessions carry the wallet's own redirect target in
// session.peer.metadata.redirect — using it is the only reliable way to
// re-open the exact wallet that holds the session. Outside Telegram we can
// fire the native scheme directly; inside the Telegram webview custom schemes
// throw ERR_UNKNOWN_URL_SCHEME, so we use the universal link instead.
export function openWalletForRequest(provider, universalFallback) {
  const redirect = provider?.session?.peer?.metadata?.redirect || {};
  const universal = redirect.universal || universalFallback;
  const native = redirect.native;

  if (isInsideTelegram()) {
    if (universal) openWalletLink(universal);
    return;
  }
  if (native) {
    try { window.location.href = native; return; } catch { /* fall through */ }
  }
  if (universal) openWalletLink(universal);
}