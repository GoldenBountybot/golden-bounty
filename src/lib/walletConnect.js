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
    methods: ['eth_sendTransaction', 'eth_getTransactionReceipt', 'personal_sign'],
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
export async function connectWalletConnect(chainId) {
  const provider = await getProvider(chainId);
  if (!provider) return null;
  try {
    const accounts = await provider.enable();
    return { provider, account: accounts && accounts[0] };
  } catch {
    return null;
  }
}

export async function disconnectWalletConnect() {
  try { const p = await providerPromise; if (p?.disconnect) await p.disconnect(); } catch {}
  providerPromise = null; currentChainId = null;
}