import EthereumProvider from '@walletconnect/ethereum-provider';
import { WALLETCONNECT_PROJECT_ID, WALLETCONNECT_METADATA } from './walletConfig';

// Per-chain WalletConnect EIP-1193 provider for EVM USDT deposits.
let providerPromise = null;
let currentChainId = null;
let uriSubscriber = null;

export function hasWalletConnect() {
  return !!WALLETCONNECT_PROJECT_ID;
}

export function onWalletConnectUri(cb) {
  uriSubscriber = cb;
}

// Wipes every WalletConnect v2 key from local storage. A half-finished or
// wallet-side-deleted pairing leaves records behind that make the provider
// believe it is still connected — after that no connection request and no
// transaction request ever reaches the wallet again.
function purgeWalletConnectStorage() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('wc@2') || k.startsWith('WALLETCONNECT') || k.startsWith('walletconnect'))) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

async function getProvider(chainId) {
  if (!WALLETCONNECT_PROJECT_ID) return null;
  // Reuse if already initialised for the same chain.
  if (providerPromise && currentChainId === chainId) return providerPromise;
  // Different chain → tear down the old session first.
  if (providerPromise) {
    try { const p = await providerPromise; if (p?.disconnect) await p.disconnect(); } catch {}
    providerPromise = null; currentChainId = null;
  }
  currentChainId = chainId;
  providerPromise = EthereumProvider.init({
    projectId: WALLETCONNECT_PROJECT_ID,
    chains: [chainId],
    optionalChains: [chainId],
    showQrModal: false,
    // REQUIRED methods must only contain what wallets actually implement.
    // Asking for anything else (e.g. eth_getTransactionReceipt, which is an RPC
    // method, not a wallet method) makes the wallet reject the whole session
    // proposal — the connection request then never appears on the phone.
    methods: ['eth_sendTransaction', 'personal_sign'],
    optionalMethods: ['eth_signTypedData', 'eth_signTypedData_v4', 'eth_sign', 'wallet_switchEthereumChain', 'wallet_addEthereumChain'],
    events: ['chainChanged', 'accountsChanged'],
    metadata: WALLETCONNECT_METADATA,
  }).then((p) => {
    p.on('display_uri', (uri) => { if (uriSubscriber) uriSubscriber(uri); });
    return p;
  });
  return providerPromise;
}

// Pre-warm the provider (init only) so connect is faster when the user taps.
export async function preloadWalletConnect(chainId) {
  try { await getProvider(chainId); } catch {}
  return true;
}

// Connects the user's mobile wallet on the given chain. Returns { provider, account }.
// Every deposit starts a FRESH pairing: a restored session that the wallet no
// longer holds looks connected here but silently swallows every request, which
// is indistinguishable (for the player) from a broken app.
export async function connectWalletConnect(chainId) {
  await disconnectWalletConnect();
  const provider = await getProvider(chainId);
  if (!provider) return null;
  try {
    const accounts = await provider.enable();
    if (!accounts || !accounts.length) throw new Error('no accounts');
    return { provider, account: accounts[0] };
  } catch (e) {
    console.error('WalletConnect connect failed:', e);
    // A failed / cancelled pairing leaves the provider holding a dead proposal,
    // so the next attempt never emits a fresh display_uri.
    await disconnectWalletConnect();
    return null;
  }
}

export async function disconnectWalletConnect() {
  try { const p = await providerPromise; if (p?.session && p?.disconnect) await p.disconnect(); } catch {}
  providerPromise = null; currentChainId = null;
  purgeWalletConnectStorage();
}

// Disconnect an injected EVM provider (MetaMask / Trust Wallet extension) by
// revoking account permissions via EIP-2255. Falls back silently when the
// wallet doesn't support it — local state is still cleared by the caller.
export async function disconnectInjected(provider) {
  if (!provider) return;
  try {
    await provider.request({ method: 'wallet_revokePermissions', params: [{ eth_accounts: {} }] });
  } catch {
    // EIP-2255 not supported — nothing more we can do to the wallet itself.
  }
}