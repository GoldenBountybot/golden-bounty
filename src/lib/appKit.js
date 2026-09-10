// Reown AppKit — the official WalletConnect SDK. It ships its own connect
// modal, handles MetaMask / Trust / 400+ wallets, and has built-in support for
// the Telegram Mini App webview (it opens wallet links through Telegram's own
// openLink instead of navigating the webview to a dead deep link).
import { createAppKit, CoreHelperUtil } from '@reown/appkit/react';
import { ChainController, ConnectorController, ModalController, RouterController } from '@reown/appkit-controllers';
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
let watchdogTimer = null;

function getWalletConnectRelayer() {
  try {
    const connector =
      ConnectorController.state.connectors?.find((c) => c.type === 'WALLET_CONNECT') ||
      ConnectorController.getConnectorById('WALLET_CONNECT');
    return connector?.provider?.client?.core?.relayer || null;
  } catch { return null; }
}

// Full close+open of the relay transport, used right after returning from the
// wallet app: the suspended Telegram webview leaves behind a dead (or zombie)
// socket that WalletConnect never recovers from on its own. Re-opening makes
// the relay re-deliver the buffered session approval.
export async function reconnectWalletConnectRelay() {
  if (!isInsideTelegram()) return;
  if (Date.now() - lastRelayNudge < 3000) return;
  lastRelayNudge = Date.now();
  const relayer = getWalletConnectRelayer();
  if (!relayer) return;
  try { await relayer.transportClose(); } catch {}
  try { await relayer.transportOpen(); } catch {}
}

// Light health check while the app is visible: if the relay is down, try to
// open it again. Covers the intermittent case where the first reconnect
// attempt failed (e.g. the network was not up yet the moment the webview
// resumed) — after an explicit close WalletConnect gives up permanently, so
// without this retry the "Connecting to MetaMask..." state hangs forever.
function isConnectingToWallet() {
  try {
    const open = !!ModalController.state.open;
    const view = RouterController.state.view;
    return (
      open &&
      [
        'ConnectingWalletConnect',
        'ConnectingWalletConnectBasic',
        'ConnectingExternal',
        'ConnectingMultiChain',
      ].includes(view)
    );
  } catch { return false; }
}

// Runs on a short cycle while the app is visible. While the "Connecting to
// MetaMask..." screen is up, keep re-opening the relay transport until the
// buffered approval arrives: a single reconnect attempt is sometimes not
// enough after the webview was suspended, and the connect previously only
// succeeded after the user turned the screen off and on — which repeats
// exactly this nudge. This automates that recovery so the screen never has
// to sleep first.
// A settled WalletConnect session is kept in localStorage, but after the page
// reloads AppKit does not always wire that saved session up on its own — the
// app then shows the wallet as disconnected even though it was connected
// before, and the user has to connect all over again. When a session is
// stored while AppKit reports no active account, give AppKit ten seconds to
// finish restoring it, then reload the page once: a fresh AppKit
// initialization restores the session and the wallet comes back connected.
// This never runs while a connect is in progress — there is no stored session
// yet in that case, and reloading would only cancel the pending approval in
// the wallet and force the user to connect a second time.
let restoreSince = 0;

function reloadOnce() {
  let count = 0;
  let lastReload = 0;
  try {
    count = Number(sessionStorage.getItem('gbWcReloadCount') || 0);
    lastReload = Number(sessionStorage.getItem('gbWcReloadAt') || 0);
  } catch {}
  if (count >= 2 || Date.now() - lastReload < 45000) return;
  try {
    sessionStorage.setItem('gbWcReloadCount', String(count + 1));
    sessionStorage.setItem('gbWcReloadAt', String(Date.now()));
  } catch {}
  window.location.reload();
}

function ensureWalletSessionRestored() {
  let storedSession = false;
  try {
    const connector =
      ConnectorController.state.connectors?.find((c) => c.type === 'WALLET_CONNECT') ||
      ConnectorController.getConnectorById('WALLET_CONNECT');
    storedSession = !!connector?.provider?.session;
  } catch {}
  let connected = false;
  try { connected = !!ChainController.state.activeCaipAddress?.eip155; } catch {}
  if (connected || !storedSession) {
    restoreSince = 0;
    return;
  }
  if (!restoreSince) restoreSince = Date.now();
  if (Date.now() - restoreSince >= 10000) reloadOnce();
}

async function ensureRelayConnected() {
  if (!isInsideTelegram()) return;
  if (document.visibilityState !== 'visible') return;
  const relayer = getWalletConnectRelayer();
  if (isConnectingToWallet()) {
    // Keep re-opening the relay until the buffered approval arrives. Never
    // reload in this state: the session only reaches our storage when its
    // approval arrives, so a reload would just cancel the pending connect.
    if (relayer && Date.now() - lastRelayNudge >= 3000) {
      lastRelayNudge = Date.now();
      try { await relayer.transportClose(); } catch {}
      try { await relayer.transportOpen(); } catch {}
    }
    return;
  }
  ensureWalletSessionRestored();
  if (!relayer) return;
  if (relayer.connected || relayer.connecting) return;
  try { await relayer.transportOpen(); } catch {}
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      clearInterval(watchdogTimer);
      watchdogTimer = setInterval(ensureRelayConnected, 3000);
      reconnectWalletConnectRelay();
    } else {
      clearInterval(watchdogTimer);
    }
  });
  window.addEventListener('focus', reconnectWalletConnectRelay);
  window.addEventListener('online', ensureRelayConnected);
  // If Telegram reloaded the webview (fresh page) while the wallet was open,
  // give AppKit time to initialize, then nudge and start the watchdog.
  setTimeout(reconnectWalletConnectRelay, 2500);
  setTimeout(ensureRelayConnected, 6000);
  watchdogTimer = setInterval(ensureRelayConnected, 3000);
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