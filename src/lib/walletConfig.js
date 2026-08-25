// WalletConnect v2 requires a free projectId from Reown Cloud.
// Get yours at https://cloud.reown.com (sign up → create project → copy Project ID).
// Paste it below. While empty, the mobile QR connect option is disabled.
export const WALLETCONNECT_PROJECT_ID = 'da17bc578f57a7ecb96c1ae7f2eb988a';

export const WALLETCONNECT_METADATA = {
  name: 'Golden Bounty',
  description: 'Golden Bounty — casino deposit',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://golden-bounty.base44.app',
  // Wallets need at least one icon; an empty array makes some wallets discard
  // the session proposal instead of showing the connection request.
  icons: ['https://media.base44.com/images/public/6a5698edffaa42a5b6637776/c39869f00_file_000000003b6c821193c37e7c968d77f2.png'],
};