import MetaMaskSDK from '@metamask/sdk';

// Singleton MetaMask SDK instance. The SDK uses MetaMask's own relay server
// (NOT WalletConnect) with automatic deep-link handling on mobile — this is
// MetaMask's official, maintained approach and avoids the WC deep-link encoding
// bugs that prevent the connection prompt from appearing.
let sdkInstance = null;
let uriSubscriber = null;

export function getMetaMaskSdk() {
  if (!sdkInstance) {
    sdkInstance = new MetaMaskSDK({
      dappMetadata: {
        name: 'Golden Bounty',
        url: typeof window !== 'undefined' ? window.location.href : 'https://golden-bounty.base44.app',
      },
      // false → the SDK opens https://metamask.app.link universal links instead
      // of the metamask:// scheme, which webviews (Telegram) refuse to load.
      useDeeplink: false,
      injectProvider: false,
      checkInstallationImmediately: false,
      checkInstallationOnAllCalls: false,
      // Suppress the SDK's built-in QR modal — we render our own QR code from
      // the display_uri event so the UI matches the Trust Wallet deposit flow.
      modals: {
        install: () => ({ mount: () => {}, unmount: () => {} }),
      },
    });
    // Fire the WC pairing URI to whoever subscribed (our deposit component).
    sdkInstance.on('display_uri', (uri) => {
      if (uriSubscriber) uriSubscriber(uri);
    });
  }
  return sdkInstance;
}

// Pre-warm the SDK (create + init) so tapping Connect doesn't pay the
// initialisation cost — the wallet request goes out immediately instead.
export async function preloadMetaMask() {
  try {
    const sdk = getMetaMaskSdk();
    if (typeof sdk.init === 'function') await sdk.init();
  } catch { /* connect() will init again if needed */ }
  return true;
}

export function onMetaMaskUri(cb) {
  uriSubscriber = cb;
}

export function getInjectedMetaMask() {
  if (typeof window === 'undefined') return null;
  // EIP-6963: prefer announced providers, fall back to window.ethereum.
  if (window.ethereum?.isMetaMask) return window.ethereum;
  // Some wallets inject as an array
  if (Array.isArray(window.ethereum)) {
    return window.ethereum.find((p) => p?.isMetaMask) || null;
  }
  return null;
}

export async function disconnectMetaMask() {
  if (sdkInstance) {
    try { await sdkInstance.terminate(); } catch {}
    try { await sdkInstance.disconnect(); } catch {}
  }
  // A stored-but-dead session makes the SDK believe it is still connected, and
  // every later request is swallowed instead of reaching the wallet. Drop the
  // instance and its persisted keys so the next connect pairs from scratch.
  sdkInstance = null;
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('wc@2') || k.startsWith('.MMSDK') || k.startsWith('MMSDK') || k.startsWith('metamask'))) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {}
  uriSubscriber = null;
}