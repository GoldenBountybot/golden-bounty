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
import { supabase } from '@/api/supabaseClient';

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
    const link = normalizeAndroidDeepLink(href);
    // Telegram suspends this webview the instant the OS switches to the
    // wallet, which can kill the relay socket BEFORE the freshly created
    // pairing / session proposal finishes publishing. On the FIRST connect
    // there is no cached pairing yet, so MetaMask then opens an empty pairing
    // and silently drops the request — the "first tap fails, second works"
    // pattern. Keep the webview (and its live socket) alive briefly so the
    // publish completes, and only then hand the link to the OS.
    if (href.indexOf('wc?uri=') !== -1) {
      const startedAt = Date.now();
      const handOff = () => openWalletLink(link);
      const waitForRelay = () => {
        const relayer = getWalletConnectRelayer();
        if ((relayer && relayer.connected) || Date.now() - startedAt > 4000) {
          setTimeout(handOff, 350);
        } else {
          setTimeout(waitForRelay, 100);
        }
      };
      waitForRelay();
      return;
    }
    openWalletLink(link);
    return;
  }
  originalOpenHref.call(CoreHelperUtil, href, target, features);
};

// Telegram suspends this webview — and with it the WalletConnect relay
// WebSocket — while the wallet app is in the foreground. WalletConnect's
// own engine detects the dead socket and re-opens its transport by itself;
// our recovery helper (recoverRelayIfDown below) only ever OPENS a transport
// the engine reports as fully down, and never closes a live one mid-handshake.
let watchdogTimer = null;

// Silent diagnostics for the Telegram wallet-connect flow: one Supabase row per
// event, no on-screen element, nothing that can influence the connect flow.
// Read back out-of-band to see what actually happened on the phone (relay
// state, nudge timing, whether the approval ever settled).
const diagT0 = Date.now();
let diagLastConnecting = 0;
// True from the moment the user taps connect on the deposit screen until the
// session settles. The webview freezes before the watchdog can even notice
// the connecting view, so this explicit mark is the only reliable record that
// an attempt was in flight when Telegram suspended us.
let connectAttemptStarted = false;
function diag(event, detail) {
  // Timestamped console trace for on-device debugging (chrome://inspect).
  // Details are relay state only — never tokens, keys or user data.
  try { console.log(`[gb-wc] +${Date.now() - diagT0}ms ${event} ${detail || ''}`); } catch {}
  try {
    supabase
      .from('wc_diag_logs')
      .insert({ event, detail: detail || null, elapsed_ms: Date.now() - diagT0 })
      .then(() => {}, () => {});
  } catch {}
}
function relayerState() {
  try {
    const r = getWalletConnectRelayer();
    return { hasRelayer: !!r, connected: r?.connected, connecting: r?.connecting };
  } catch {
    return { hasRelayer: false, connected: null, connecting: null };
  }
}

function getWalletConnectRelayer() {
  try {
    const connector =
      ConnectorController.state.connectors?.find((c) => c.type === 'WALLET_CONNECT') ||
      ConnectorController.getConnectorById('WALLET_CONNECT');
    return connector?.provider?.client?.core?.relayer || null;
  } catch { return null; }
}

// The connected wallet's name, read live from AppKit's controllers. The
// useWalletInfo hook can still be empty right after a session settles — the
// Trust pre-fill decision must not depend on it, so read the state directly.
export function getConnectedWalletName() {
  try {
    if (typeof window !== 'undefined' && window.trustwallet) return 'Trust Wallet';
    const active = ConnectorController.state.activeConnector;
    const conn = ConnectorController.state.connectors?.find((c) => c.id === active?.id) || active;
    const name = conn?.walletInfo?.name || conn?.provider?.walletInfo?.name;
    if (name) return String(name);
    const wc = ConnectorController.state.connectors?.find((c) => c.type === 'WALLET_CONNECT');
    const sessions = wc?.provider?.client?.session?.values || [];
    for (const s of sessions) {
      const peer = s?.peer?.metadata?.name;
      if (peer) return String(peer);
    }
  } catch {}
  return '';
}

// transportOpen() can hang forever on the zombie socket the suspended
// Telegram webview sometimes leaves behind — race it against a timeout so
// recovery always completes and releases its lock.
function withTimeout(promise, ms) {
  return Promise.race([
    Promise.resolve(promise).catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, ms)),
  ]);
}

// THE single recovery path for the relay transport — every trigger (connect
// attempt, resume, focus, watchdog tick, page load) funnels through here.
// It only ever OPENS a transport that WalletConnect itself reports as fully
// down, and it NEVER closes a live or connecting socket: device logs showed
// the old close+open "nudge" firing with the relay already connected during a
// pending MetaMask approval — killing the healthy socket, forcing the
// pairing topic to re-subscribe from scratch, and delaying or swallowing the
// approval popup for 20-30 seconds (the exact reported symptom). The lock
// guarantees no two recovery operations ever overlap; the throttle stops
// tight retry loops.
let relayRecoveryInProgress = false;
let lastRecoveryAt = 0;
async function recoverRelayIfDown(relayer) {
  if (!relayer || relayer.connected || relayer.connecting) return;
  if (relayRecoveryInProgress) return;
  if (Date.now() - lastRecoveryAt < 3000) return;
  relayRecoveryInProgress = true;
  lastRecoveryAt = Date.now();
  diag('recovery-start', JSON.stringify(relayerState()));
  await withTimeout(relayer.transportOpen(), 10000);
  relayRecoveryInProgress = false;
  diag('recovery-done', JSON.stringify(relayerState()));
}

// Marks that a wallet connect actually started on the deposit screen. Called
// BEFORE appKit.open() hands the user to the wallet app, because the webview
// freezes before any interval or router state change could be observed.
export function noteConnectAttempt() {
  connectAttemptStarted = true;
  diag('attempt', JSON.stringify(relayerState()));
  // Make sure the relay transport is up before the user picks a wallet, so
  // the proposal leaves over a live socket the instant they tap MetaMask.
  // Safe by design: this only opens a fully-down transport and never
  // touches a live or connecting one, and the shared recovery lock means it
  // can never race another recovery operation.
  reconnectWalletConnectRelay();
}

// The WalletConnect proposal lives 5 minutes; a longer stay in the wallet (or
// a longer screen-off) kills the connect flow while the webview is frozen, and
// the return lands on a dead "Connecting" screen. The resume nudge can still
// settle an approval that arrived in time; wait a few seconds for that, and
// if the wallet is still not connected and nothing is in flight, reopen the
// connect modal once so a single tap restarts the connect instead of leaving
// the user on a dead screen.
let resumeRetryScheduled = false;
function scheduleResumeRetry() {
  if (!connectAttemptStarted || resumeRetryScheduled) return;
  resumeRetryScheduled = true;
  setTimeout(() => {
    resumeRetryScheduled = false;
    if (!connectAttemptStarted) return;
    let connected = false;
    try { connected = !!ChainController.state.activeCaipAddress?.eip155; } catch {}
    let modalOpen = false;
    try { modalOpen = !!ModalController.state.open; } catch {}
    if (connected || isConnectingToWallet() || modalOpen) return;
    // Resume only ever inside the deposit flow's wallet screen. Firing the
    // modal anywhere else — dashboard, or the "Choose Payment" screen of a
    // FRESH deposit — hijacks whatever the user is doing and looks like the
    // deposit jumped straight to MetaMask on its own.
    if (window.location.pathname !== '/pay' || !window.location.search.includes('method=')) return;
    connectAttemptStarted = false;
    diag('auto-retry', JSON.stringify(relayerState()));
    try { appKit.open(); } catch {}
  }, 5000);
}

// Safe relay recovery for resume/focus/load triggers: open the transport only
// when WalletConnect reports it fully down. Never close an active relay —
// force-closing a live socket is what used to interrupt a pending approval.
export async function reconnectWalletConnectRelay() {
  if (!isInsideTelegram()) return;
  await recoverRelayIfDown(getWalletConnectRelayer());
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
// MetaMask..." screen is up it only ASSISTS a transport WalletConnect itself
// reports as fully down (see recoverRelayIfDown) — it never closes or
// restarts a live relay, so a pending approval handshake is never interrupted.
// A settled WalletConnect session is kept in localStorage, but after the page
// reloads AppKit does not always wire that saved session up on its own — the
// app then shows the wallet as disconnected even though it was connected
// before, and the user has to connect all over again.
//
// There is NO forced page reload for this anymore. The old recovery reload
// fired anywhere in the app (e.g. mid-typing a deposit amount), slammed the
// user back into the full entry loading screen and re-entered the app from
// whatever URL was open — the exact "random loading while using the app"
// reported on the phone. If the saved session doesn't come back on its own,
// the wallet simply shows as disconnected and one tap from the deposit
// screen reconnects it.
function ensureWalletSessionRestored() {}

// If the "Connecting" screen is still up with a healthy relay well after
// resume, the wallet's approval is simply gone — it was sent while this
// webview was frozen and the relay does not redeliver it, so no amount of
// nudging brings it back. Recover instead: close the dead screen and reopen
// the wallet list so a single tap starts a fresh request.
let stuckSince = 0;
let stuckHandoff = false;

async function ensureRelayConnected() {
  if (!isInsideTelegram()) return;
  if (document.visibilityState !== 'visible') return;
  const relayer = getWalletConnectRelayer();
  if (isConnectingToWallet()) {
    if (Date.now() - diagLastConnecting > 10000) {
      diagLastConnecting = Date.now();
      diag('connecting', JSON.stringify(relayerState()));
    }
    // SAFE recovery only — never a close+open. The old 7-second reopen loop
    // here killed a HEALTHY relay right while MetaMask was waiting for the
    // pairing handshake (device logs: nudge-start connected:true →
    // nudge-done connected:false, repeatedly), which forced the pairing topic
    // to re-subscribe from scratch and delayed or swallowed the approval
    // popup for 20-30 seconds. A connected relay is left strictly alone
    // while a request is pending; we only open a transport the engine
    // reports as fully down, under the shared recovery lock.
    await recoverRelayIfDown(relayer);
    if (relayer && relayer.connected && connectAttemptStarted) {
      if (!stuckSince) stuckSince = Date.now();
      else if (Date.now() - stuckSince >= 30000 && !stuckHandoff) {
        stuckHandoff = true;
        stuckSince = 0;
        diag('stuck', JSON.stringify(relayerState()));
        try { ModalController.close(); } catch {}
        setTimeout(() => {
          stuckHandoff = false;
          try { appKit.open({ view: 'Connect' }); } catch { try { appKit.open(); } catch {} }
        }, 600);
      }
    } else {
      stuckSince = 0;
    }
    // NOTE: no page-reload fallback here. A fresh page means a fresh
    // WalletConnect engine with no pending session proposal — a reload
    // would silently discard the approval the user already gave and force
    // a second connect. Recovery must keep THIS page alive.
    return;
  }
  stuckSince = 0;
  let connectedNow = false;
  try { connectedNow = !!ChainController.state.activeCaipAddress?.eip155; } catch {}
  if (connectedNow) connectAttemptStarted = false;
  if (connectedNow && diagLastConnecting) {
    diagLastConnecting = 0;
    diag('settled', JSON.stringify(relayerState()));
  }
  ensureWalletSessionRestored();
  await recoverRelayIfDown(relayer);
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      diag('visible', JSON.stringify({ connecting: isConnectingToWallet(), ...relayerState() }));
      clearInterval(watchdogTimer);
      watchdogTimer = setInterval(ensureRelayConnected, 3000);
      reconnectWalletConnectRelay();
      scheduleResumeRetry();
    } else {
      diag('hidden', JSON.stringify({ connecting: isConnectingToWallet() }));
      clearInterval(watchdogTimer);
    }
  });
  window.addEventListener('focus', reconnectWalletConnectRelay);
  window.addEventListener('online', ensureRelayConnected);
  // If Telegram reloaded the webview (fresh page) while the wallet was open,
  // give AppKit time to initialize, then check the relay and start the watchdog.
  setTimeout(reconnectWalletConnectRelay, 2500);
  setTimeout(ensureRelayConnected, 6000);
  watchdogTimer = setInterval(ensureRelayConnected, 3000);
  diag('load', JSON.stringify({ ua: (navigator.userAgent || '').slice(0, 140), tg: isInsideTelegram() }));
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