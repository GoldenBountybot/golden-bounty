// Reown AppKit — the official WalletConnect SDK. It ships its own connect
// modal, handles MetaMask / Trust / 400+ wallets, and has built-in support for
// the Telegram Mini App webview (it opens wallet links through Telegram's own
// openLink instead of navigating the webview to a dead deep link).
import { createAppKit, CoreHelperUtil } from '@reown/appkit/react';
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
const originalOpenHref = CoreHelperUtil.openHref;
CoreHelperUtil.openHref = (href, target, features) => {
  if (isInsideTelegram()) {
    openWalletLink(href);
    return;
  }
  originalOpenHref.call(CoreHelperUtil, href, target, features);
};

export function networkByChainId(chainId) {
  return networks.find((n) => Number(n.id) === Number(chainId)) || networks[0];
}