import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { findOrCreateWallet } from '../../shared/wallet.ts';

// Server-side withdrawal submission. Replaces the old client-side flow where
// the frontend called Transaction.create() directly — which let any user
// submit withdrawal requests with $0 balance by bypassing the client-side
// maxWithdrawable check (e.g. from the browser console).
//
// This function validates EVERYTHING server-side before creating the
// pending withdrawal Transaction:
//   1. User is not banned
//   2. Amount >= $5 minimum
//   3. User's actual wallet balance >= amount (server-side, can't be faked)
//   4. Wagering requirement met (wager_remaining == 0, or amount fits in
//      the withdrawable portion above the locked deposit)
//   5. No more than 3 pending withdrawals already exist (anti-spam)
//
// Only after all checks pass does it create the Transaction (service role,
// bypasses RLS) and return success.

const MIN_WITHDRAWAL = 5;
const MAX_PENDING_WITHDRAWALS = 3;

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body: any = {};
    try { body = await req.json(); } catch (_e) {}
    const amount = Number(body.amount || 0);
    // Only allow "usdt" — the sole supported withdrawal method. Prevents
    // method injection (the old hack used "stripe" / "ton" to disguise entries).
    const method = 'usdt';
    const reference = String(body.reference || '').trim();   // wallet address
    const note = String(body.note || '');

    if (!amount || amount < MIN_WITHDRAWAL) {
      return Response.json({ error: `Minimum withdrawal is $${MIN_WITHDRAWAL.toFixed(2)}` }, { status: 400 });
    }
    if (!reference) {
      return Response.json({ error: 'Wallet address required' }, { status: 400 });
    }

    // ── Server-side wallet & security checks ──
    const wallet = await findOrCreateWallet(base44, user.id);
    if (wallet.banned) {
      return Response.json({ error: 'Account banned' }, { status: 403 });
    }

    const balance = Number(wallet.balance ?? 0);
    const wagerRemaining = Number(wallet.wager_remaining ?? 0);
    const stakedAmount = Number(wallet.staked_amount ?? 0);

    // Available = balance minus locked stake minus unplayed-through deposit.
    const available = Math.max(0, balance - stakedAmount - wagerRemaining);

    if (amount > balance) {
      return Response.json({
        error: 'Insufficient balance',
        detail: `Your balance is $${balance.toFixed(2)} but you requested $${amount.toFixed(2)}.`,
      }, { status: 400 });
    }

    if (amount > available) {
      return Response.json({
        error: 'Wagering requirement not met',
        detail: wagerRemaining > 0
          ? `Play through or stack $${wagerRemaining.toFixed(2)} of your deposit before withdrawing.`
          : 'Only winnings above your locked deposit can be withdrawn.',
      }, { status: 400 });
    }

    // ── Anti-spam: limit pending withdrawals ──
    const pending = await base44.asServiceRole.entities.Transaction.filter({
      user_id: user.id, type: 'withdraw', status: 'pending',
    }, '-created_date', 100);
    if (pending.length >= MAX_PENDING_WITHDRAWALS) {
      return Response.json({
        error: 'Too many pending withdrawals',
        detail: `You already have ${pending.length} withdrawal request(s) awaiting approval. Please wait for them to be processed.`,
      }, { status: 400 });
    }

    // ── All checks passed — create the withdrawal transaction ──
    const tx = await base44.asServiceRole.entities.Transaction.create({
      user_id: user.id,
      user_email: user.email || '',
      type: 'withdraw',
      amount,
      status: 'pending',
      method,
      reference,
      note,
    });

    return Response.json({
      ok: true,
      transaction_id: tx.id,
      balance: balance,
      available: available,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}