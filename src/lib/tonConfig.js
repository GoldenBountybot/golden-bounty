// TON network config for USDT (Jetton) deposits via Tonkeeper.
// USDT on TON is a Jetton (Tether USD), 6 decimals.
export const TON_USDT_MASTER = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
export const TON_USDT_MASTER_RAW = '0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe';
// Admin's TON wallet (receives the USDT) — same address as the TON row in PayMethod.
export const TON_ADMIN = 'UQCTtNPN9ZzlXWsiE-VHApcouD8tFHgBIcC3hD-GcQdDrgKN';
export const TON_USDT_DECIMALS = 6;

// tonapi.io works without an API key (rate-limited). Returns the user's USDT
// jetton-wallet address (raw 0:hex form) for the wallet that holds USDT.
export async function getUserJettonWallet(userAddress) {
  try {
    const r = await fetch(`https://tonapi.io/v2/accounts/${userAddress}/jettons`);
    if (!r.ok) return null;
    const j = await r.json();
    const found = (j.balances || []).find(
      (b) => b.jetton && b.jetton.address === TON_USDT_MASTER_RAW
    );
    return found?.wallet_address?.address || null;
  } catch {
    return null;
  }
}