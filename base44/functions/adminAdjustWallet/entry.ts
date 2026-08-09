import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { findOrCreateWallet } from '../../shared/wallet.ts';

// Admin-only: adjusts any user's wallet by a delta (credit or debit). Used by
// the admin Transactions panel and the referral commission flow. Verifies the
// caller is an admin, then applies the change as the service role. Mirrors
// the result to User.balance for display compatibility.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const targetUserId = String(body.user_id || '');
    const delta = Number(body.delta ?? 0);
    const wagerDelta = Number(body.wager_delta ?? 0);

    if (!targetUserId || !isFinite(delta)) {
      return Response.json({ error: 'invalid-params' }, { status: 400 });
    }

    const wallet = await findOrCreateWallet(base44, targetUserId);
    const newBal = Math.max(0, Number(wallet.balance ?? 0) + delta);
    const newWager = Math.max(0, Number(wallet.wager_remaining ?? 0) + wagerDelta);

    await base44.asServiceRole.entities.Wallet.update(wallet.id, {
      balance: newBal,
      wager_remaining: newWager,
    });

    // Mirror to User entity for display compatibility.
    try {
      await base44.asServiceRole.entities.User.update(targetUserId, {
        balance: newBal,
        wager_remaining: newWager,
      });
    } catch { /* mirror is best-effort */ }

    return Response.json({ balance: newBal, wager_remaining: newWager });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}