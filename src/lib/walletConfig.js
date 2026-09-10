// WalletConnect v2 requires a free projectId from Reown Cloud.
// Get yours at https://cloud.reown.com (sign up → create project → copy Project ID).
// Paste it below. While empty, the mobile QR connect option is disabled.
export const WALLETCONNECT_PROJECT_ID = 'da17bc578f57a7ecb96c1ae7f2eb988a';

export const WALLETCONNECT_METADATA = {
  name: 'Golden Bounty',
  description: 'Golden Bounty — casino deposit',
  // Shown to the user inside the wallet's connection request — always the
  // brand domain, never the base44 host the Mini App may actually run on.
  // Must match the origin the app actually runs on — golden-bounty.com
  // 308-redirects to www, so any wallet 'return to dApp' would otherwise land
  // on a different origin with no stored WalletConnect session.
  url: 'https://www.golden-bounty.com',

  // Tell wallets how to come BACK to the Telegram Mini App. Without this,
  // MetaMask's "Return to app" opens the dApp URL in an external browser —
  // a fresh context with no WalletConnect session, so the user sees the
  // connect screen again. Point both link types at the bot so the return
  // lands in Telegram and the mini app reopens on the same origin.
  redirect: {
    native: 'tg://resolve?domain=GoldenBountybot',
    universal: 'https://t.me/GoldenBountybot',
  },
  // Wallets need at least one icon; an empty array makes some wallets discard
  // the session proposal instead of showing the connection request.
  icons: ['https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/c39869f00_file_000000003b6c821193c37e7c968d77f2.png'],
};