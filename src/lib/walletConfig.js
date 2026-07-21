// WalletConnect v2 requires a free projectId from Reown Cloud.
// Get yours at https://cloud.reown.com (sign up → create project → copy Project ID).
// Paste it below. While empty, the mobile QR connect option is disabled.
export const WALLETCONNECT_PROJECT_ID = 'da17bc578f57a7ecb96c1ae7f2eb988a';

export const WALLETCONNECT_METADATA = {
  name: 'VIP Slots',
  description: 'VIP Slots — casino deposit',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://vip-slots.app',
  icons: [],
};