import MetaMaskSDK from '@metamask/sdk';
import { openWalletLink } from '@/lib/openWalletLink';

// Singleton MetaMask SDK instance. MetaMask's own relay server (NOT
// WalletConnect) carries the session: an approval is held on MetaMask's
// server, so it survives Telegram freezing or reloading the Mini App webview
// while the wallet is open — the one-shot WalletConnect "session settled"
// event was lost every time Telegram suspended the webview, which is what
// kept breaking the connect flow.
let sdkInstance = null;

export function getMetaMaskSdk() {
  if (!sdkInstance) {
    sdkInstance = new MetaMaskSDK({
      dappMetadata: {
        name: 'Golden Bounty',
        // Always show the brand domain in MetaMask's connection request,
        // never the host the Mini App may actually be served from.
        url: 'https://golden-bounty.com',
      },
      // false → the SDK builds https://metamask.app.link universal links
      // instead of the metamask:// scheme, which webviews refuse to load.
      useDeeplink: false,
      injectProvider: false,
      checkInstallationImmediately: false,
      checkInstallationOnAllCalls: false,
      // No SDK modals or QR code UI — our own deposit UI drives the flow.
      headless: true,
      // Inside the Telegram Mini App the only reliable way to hand the phone
      // over to MetaMask is Telegram's own openLink() — window.open and
      // location.href never leave Telegram's webview.
      openDeeplink: (link) => { try { openWalletLink(link); } catch {} },
      enableAnalytics: false,
      shouldShimWeb3: false,
    });
  }
  return sdkInstance;
}

// The provider may take a moment to exist while the SDK initializes.
export async function getSdkProvider() {
  const sdk = getMetaMaskSdk();
  for (let i = 0; i < 10; i++) {
    const provider = sdk.getProvider();
    if (provider) return { sdk, provider };
    await new Promise((r) => setTimeout(r, 300));
  }
  return { sdk, provider: null };
}

export async function disconnectMetaMask() {
  if (sdkInstance) {
    try { await sdkInstance.terminate(); } catch {}
    try { await sdkInstance.disconnect(); } catch {}
  }
  // A stored-but-dead session makes the SDK believe it is still connected,
  // and every later request is swallowed instead of reaching the wallet. Drop
  // the instance and its persisted keys so the next connect pairs fresh.
  sdkInstance = null;
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('wc@2') || k.startsWith('.MMSDK') || k.startsWith('MMSDK') || k.startsWith('metamask'))) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {}
}
