import EthereumProvider from '@walletconnect/ethereum-provider';
import { WALLETCONNECT_PROJECT_ID, WALLETCONNECT_METADATA } from './walletConfig';

// Single shared WalletConnect provider (EIP-1193) for BNB Smart Chain.
let providerPromise = null;
let uriSubscriber = null;

export function hasWalletConnect() {
  return !!WALLETCONNECT_PROJECT_ID;
}

export function onWalletConnectUri(cb) {
  uriSubscriber = cb;
}

async function getProvider() {
  if (!WALLETCONNECT_PROJECT_ID) return null;
  if (!providerPromise) {
    providerPromise = EthereumProvider.init({
      projectId: WALLETCONNECT_PROJECT_ID,
      chains: [56],
      optionalChains: [56],
      showQrModal: false,
      methods: ['eth_sendTransaction', 'eth_getTransactionReceipt', 'personal_sign'],
      events: ['chainChanged', 'accountsChanged'],
      metadata: WALLETCONNECT_METADATA,
    }).then((p) => {
      p.on('display_uri', (uri) => { if (uriSubscriber) uriSubscriber(uri); });
      return p;
    });
  }
  return providerPromise;
}

// Connects the user's mobile wallet (Trust Wallet app) via WalletConnect QR.
// Returns { provider, account } or null on failure/cancel.
export async function connectWalletConnect() {
  const provider = await getProvider();
  if (!provider) return null;
  try {
    const accounts = await provider.enable();
    return { provider, account: accounts && accounts[0] };
  } catch {
    return null;
  }
}

export async function disconnectWalletConnect() {
  try {
    const provider = await providerPromise;
    if (provider && provider.disconnect) await provider.disconnect();
  } catch {}
  providerPromise = null;
}