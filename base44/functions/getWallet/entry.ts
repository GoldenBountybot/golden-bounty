import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { findOrCreateWallet } from '../../shared/wallet.ts';

// Returns the calling user's wallet (balance, wager_remaining, staking
// fields). Auto-creates the wallet on first access, migrating from the
// legacy User entity. This is the ONLY way the frontend reads financial
// state — the Wallet entity's RLS blocks users from modifying it, so the
// balance and staking fields can't be hacked via the console.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const wallet = await findOrCreateWallet(base44, user.id);
    return Response.json({
      balance: Number(wallet.balance ?? 0),
      wager_remaining: Number(wallet.wager_remaining ?? 0),
      staked_amount: Number(wallet.staked_amount ?? 0),
      staked_at: wallet.staked_at || null,
      last_profit_claim: wallet.last_profit_claim || null,
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}