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

    // SECURITY: banned users can't change their balance.
    {
      const _bw = await findOrCreateWallet(base44, user.id);
      if (_bw.banned) return Response.json({ error: 'Account banned' }, { status: 403 });
    }

    // SECURITY: reject positive balance deltas. Positive deltas (crediting
    // money) must go through verified pathways — settleBet (gameplay wins),
    // creditBonus (cashback / free-spin / task rewards), adminAdjustWallet
    // (admin), or deposit-verification functions. This prevents the "free
    // money" console hack: base44.functions.invoke('commitBalanceDelta',
    // { delta: 1000 }) is now rejected. Only negative deltas (bet deductions)
    // and zero (balance read) are allowed.
    if (delta > 0) {
      const wallet = await findOrCreateWallet(base44, user.id);
      return Response.json({
        error: 'positive-delta-not-allowed',
        balance: Number(wallet.balance ?? 0),
        wager_remaining: Number(wallet.wager_remaining ?? 0),
      }, { status: 403 });
    }

    // Nothing to apply — just return the current balance.
    if (delta === 0 && wagerDelta === 0) {
      const wallet = await findOrCreateWallet(base44, user.id);
      return Response.json({
        balance: Number(wallet.balance ?? 0),
        wager_remaining: Number(wallet.wager_remaining ?? 0),
      });
    }

    // ATOMIC CONDITIONAL UPDATE — prevents the read-modify-write race
    // condition where two concurrent calls both read the same balance, both
    // pass the `newBal < 0` check, and both deduct — overdrawing the balance.
    // The updateMany filter includes `balance: { $gte: absDelta }`, so the
    // deduction ONLY happens if the current balance is sufficient. Only one
    // concurrent call can win; the other gets `updated: 0` and is rejected.
    const absDelta = Math.abs(delta);
    const res = await base44.asServiceRole.entities.Wallet.updateMany(
      { user_id: user.id, balance: { $gte: absDelta } },
      { $inc: { balance: delta } }
    );
    if (!res || Number(res.updated || 0) === 0) {
      const recheck = await findOrCreateWallet(base44, user.id);
      return Response.json({
        error: 'insufficient-balance',
        balance: Number(recheck.balance ?? 0),
        wager_remaining: Number(recheck.wager_remaining ?? 0),
      }, { status: 400 });
    }

    // Re-read for the authoritative balance to return.
    const updated = await findOrCreateWallet(base44, user.id);
    const newBal = Number(updated.balance ?? 0);
    const newWager = Number(updated.wager_remaining ?? 0);

    // balance & wager_remaining are no longer on the User entity (moved to the
    // RLS-protected Wallet entity to prevent updateMe hacks). No mirror needed.

    return Response.json({ balance: newBal, wager_remaining: newWager });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}