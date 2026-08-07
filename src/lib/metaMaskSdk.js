import MetaMaskSDK from '@metamask/sdk';

// Singleton MetaMask SDK instance. The SDK uses MetaMask's own relay server
// (NOT WalletConnect) with automatic deep-link handling on mobile — this is
// MetaMask's official, maintained approach and avoids the WC deep-link encoding
// bugs that prevent the connection prompt from appearing.
let sdkInstance = null;

export function getMetaMaskSdk() {
  if (!sdkInstance) {
    sdkInstance = new MetaMaskSDK({
      dappMetadata: {
        name: 'Golden Bounty',
        url: typeof window !== 'undefined' ? window.location.href : 'https://golden-bounty.base44.app',
      },
      useDeeplink: true,
      injectProvider: false,
      checkInstallationImmediately: false,
      checkInstallationOnAllCalls: false,
    });
  }
  return sdkInstance;
}

export async function disconnectMetaMask() {
  if (sdkInstance) {
    try { await sdkInstance.disconnect(); } catch {}
  }
}