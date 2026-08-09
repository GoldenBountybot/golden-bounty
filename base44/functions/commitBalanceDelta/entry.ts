import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { findOrCreateWallet } from '../../shared/wallet.ts';

// Applies a gameplay balance delta to the calling user's wallet. This is the
// ONLY way gameplay can change a balance — the Wallet entity's RLS blocks
// users from updating it directly, and this function runs as the service
// role (bypassing RLS) to apply the change server-side.
//
// Security: re-reads the authoritative wallet balance from the DB before
// applying (so admin credits/deposits are never overwritten), and rejects
// any delta that would make the balance negative (prevents overdraft hacks).
// Mirrors the result to User.balance for display compatibility.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const delta = Number(body.delta ?? 0);
    const wagerDelta = Number(body.wager_delta ?? 0);

    if (!isFinite(delta) || !isFinite(wagerDelta)) {
      return Response.json({ error: 'invalid-params' }, { status: 400 });
    }

    // Nothing to apply — just return the current balance.
    if (delta === 0 && wagerDelta === 0) {
      const wallet = await findOrCreateWallet(base44, user.id);
      return Response.json({
        balance: Number(wallet.balance ?? 0),
        wager_remaining: Number(wallet.wager_remaining ?? 0),
      });
    }

    const wallet = await findOrCreateWallet(base44, user.id);
    const curBal = Number(wallet.balance ?? 0);
    const curWager = Number(wallet.wager_remaining ?? 0);
    const newBal = curBal + delta;

    // Reject if the result would be negative — prevents overdraft hacking.
    if (newBal < 0) {
      return Response.json({
        error: 'insufficient-balance',
        balance: curBal,
        wager_remaining: curWager,
      }, { status: 400 });
    }

    const newWager = Math.max(0, curWager + wagerDelta);
    await base44.asServiceRole.entities.Wallet.update(wallet.id, {
      balance: newBal,
      wager_remaining: newWager,
    });

    // Mirror to User entity for display compatibility (admin panels, etc.)
    try {
      await base44.asServiceRole.entities.User.update(user.id, {
        balance: newBal,
        wager_remaining: newWager,
      });
    } catch { /* mirror is best-effort */ }

    return Response.json({ balance: newBal, wager_remaining: newWager });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}