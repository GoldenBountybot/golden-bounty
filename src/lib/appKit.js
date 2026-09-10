// Reown AppKit — the official WalletConnect SDK. It ships its own connect
// modal, handles MetaMask / Trust / 400+ wallets, and has built-in support for
// the Telegram Mini App webview (it opens wallet links through Telegram's own
// openLink instead of navigating the webview to a dead deep link).
import { createAppKit, CoreHelperUtil } from '@reown/appkit/react';
import { ChainController, ConnectorController } from '@reown/appkit-controllers';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { bsc, mainnet, polygon } from '@reown/appkit/networks';
import { WALLETCONNECT_PROJECT_ID, WALLETCONNECT_METADATA } from '@/lib/walletConfig';
import { openWalletLink } from '@/lib/openWalletLink';
import { isInsideTelegram } from '@/lib/telegram';

export const APPKIT_NETWORKS = { bsc: 56, eth: 1, polygon: 137 };

const networks = [bsc, mainnet, polygon];

export const appKit = createAppKit({
  adapters: [new EthersAdapter()],
  networks,
  projectId: WALLETCONNECT_PROJECT_ID,
  metadata: WALLETCONNECT_METADATA,
  features: { analytics: false, email: false, socials: false },
});

// AppKit opens wallet deep links with window.open(), which Telegram's in-app
// webview silently blocks — the modal lists the wallets, but tapping one never
// reaches the wallet app, so no connect or deposit request ever appears.
// Route every wallet link through Telegram's openLink() (handed to the OS)
// instead; outside Telegram keep AppKit's original behavior untouched.
// AppKit encodes the wc?uri= payload of native deep links twice when it detects
// Telegram on Android, because it expects window.open to deliver the link —
// Telegram's webview decodes it once on the way to the wallet app. openLink()
// hands the URL to the OS verbatim, so the wallet would receive the still
// encoded pairing/request URI, open, and silently drop the connect or deposit
// request. Undo exactly that one extra encoding before opening the link.
function normalizeAndroidDeepLink(href) {
  if (!CoreHelperUtil.isTelegram() || !CoreHelperUtil.isAndroid()) return href;
  const i = href.indexOf('wc?uri=');
  if (i === -1) return href;
  try {
    return href.slice(0, i + 7) + decodeURIComponent(href.slice(i + 7));
  } catch {
    return href;
  }
}

const originalOpenHref = CoreHelperUtil.openHref;
CoreHelperUtil.openHref = (href, target, features) => {
  if (isInsideTelegram()) {
    openWalletLink(normalizeAndroidDeepLink(href));
    return;
  }
  originalOpenHref.call(CoreHelperUtil, href, target, features);
};

// Telegram suspends this webview — and with it the WalletConnect relay
// WebSocket — while the wallet app is in the foreground. After the user
// approves and returns, the frozen socket never reconnects by itself, so the
// modal stays stuck on "Continue in MetaMask" and the settled session never
// arrives. On every return to the foreground, force the relay to close and
// re-open its transport: existing topics are re-subscribed and every message
// the relay buffered while we were suspended is delivered as a batch right
// away (that is how the missed session approval finally reaches us).
let lastRelayNudge = 0;
export async function reconnectWalletConnectRelay() {
  if (!isInsideTelegram()) return;
  if (Date.now() - lastRelayNudge < 3000) return;
  lastRelayNudge = Date.now();
  try {
    const connector =
      ConnectorController.state.connectors?.find((c) => c.type === 'WALLET_CONNECT') ||
      ConnectorController.getConnectorById('WALLET_CONNECT');
    const relayer = connector?.provider?.client?.core?.relayer;
    if (!relayer) return;
    try { await relayer.transportClose(); } catch {}
    try { await relayer.transportOpen(); } catch {}
  } catch {}
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') reconnectWalletConnectRelay();
  });
  window.addEventListener('focus', reconnectWalletConnectRelay);
  // If Telegram reloaded the webview (fresh page) while the wallet was open,
  // give AppKit a moment to initialize, then do the same nudge once.
  setTimeout(reconnectWalletConnectRelay, 2500);
}

export function networkByChainId(chainId) {
  return networks.find((n) => Number(n.id) === Number(chainId)) || networks[0];
}

// The wallet connect request must only mention the network the user picked on
// the deposit screen. AppKit builds the WalletConnect session proposal from
// every network it was created with, so by default the wallet is asked to
// approve BSC + Ethereum + Polygon all at once — and any later transaction
// rides on whichever chain the wallet picks. Trim the runtime network list down
// to the selected chain right before connecting: the connect request, and the
// deposit request after it, then both target that network only.
export function restrictToSelectedNetwork(chainId) {
  const selected = networkByChainId(chainId);
  // Add the selected network FIRST so the list is never momentarily empty —
  // clearing it would hide every EVM wallet from the connect modal.
  try { ChainController.addNetwork(selected); } catch {}
  networks.forEach((n) => {
    if (n !== selected) {
      try { ChainController.removeNetwork('eip155', n.id); } catch {}
    }
  });
}

// Bring the full network list back after disconnecting, so the next deposit
// starts from a clean state no matter which chain it targets.
export function restoreAllNetworks() {
  networks.forEach((n) => {
    try { ChainController.addNetwork(n); } catch {}
  });
}